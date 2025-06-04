'use client';
import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

const Page = () => {
  const { data: session } = useSession();
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [videoHistory, setVideoHistory] = useState<{
    urls: { url: string; prompt: string; genRes: string }[];
    currentIndex: number;
  }>({
    urls: [],
    currentIndex: -1,
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  // Use ref to store interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to start polling
  const startPolling = (jobId: string) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_BASE_URL}/prompt/${jobId}`, {
          headers: { 
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${session?.user?.accessToken}`
          },
        });

        console.log(res, 'getting res from backend');
        
        if (!res.data.success) {
          return;
        }

        const data = res.data;
        console.log(data, 'getting data from backend');
        
        if (data.jobStatus === 'completed') {
          // Stop polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          setLoading(false);
          toast.success('Video generation completed');
          setCurrentVideoUrl(data.genUrl);
          
          // Update video history with the completed video
          setVideoHistory(prev => {
            const newUrls = [...prev.urls];
            if (newUrls.length > 0) {
              newUrls[newUrls.length - 1] = {
                ...newUrls[newUrls.length - 1],
                url: data.genUrl
              };
            }
            return {
              ...prev,
              urls: newUrls
            };
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  // Function to stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePromptSubmit = async (prompt: string, params: {
    width: number;
    height: number;
    fps: number;
    frameCount: number;
  }) => {
    setLoading(true);
    
    try {
      const endpoint = isFollowUp
        ? `${BACKEND_BASE_URL}/prompt/followUpPrompt`
        : `${BACKEND_BASE_URL}/prompt`;

      const body = isFollowUp
        ? {
            chatSessionId: sessionId,
            followUprompt: prompt,
            previousGenRes: currentResponse,
            ...params
          }
        : {
            prompt,
            ...params
          };
          
      console.log(body, 'sending body to backend');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      console.log(data, 'getting data from backend');

      if (!data.success) {
        toast.error(data.message);
        setLoading(false);
        return;
      }

      // Set session ID if this is the first prompt
      if (data.data?.chatSessionId) {
        setSessionId(data.data.chatSessionId);
      }

      // Set current job ID
      if (data.data?.jobId) {
        setCurrentJobId(data.data.jobId);
        // Start polling for this job
        startPolling(data.data.jobId);
      }

      // Set current prompt and response immediately
      setCurrentPrompt(prompt);
      setCurrentResponse(''); // Will be updated when polling completes
      setCurrentVideoUrl(null); // Will be updated when polling completes
      setIsFollowUp(true);

      // Add to history (video URL will be updated when polling completes)
      const newHistoryItem = {
        url: '', // Will be updated when video is ready
        prompt: prompt,
        genRes: '' // Will be updated when polling completes
      };

      setVideoHistory(prev => {
        const newUrls = prev.urls.slice(0, prev.currentIndex + 1);
        newUrls.push(newHistoryItem);
        return {
          urls: newUrls,
          currentIndex: newUrls.length - 1
        };
      });

      return {
        videoUrl: '',
        genRes: '',
        prompt: prompt
      };

    } catch (err) {
      console.error(err);
      toast.error('Failed to generate video');
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (videoHistory.currentIndex <= 0) {
      toast("No more history to undo");
      return;
    }
    
    const newIndex = videoHistory.currentIndex - 1;
    const historyItem = videoHistory.urls[newIndex];
    
    setVideoHistory(prev => ({
      ...prev,
      currentIndex: newIndex
    }));
    
    setCurrentVideoUrl(historyItem.url);
    setCurrentPrompt(historyItem.prompt);
    setCurrentResponse(historyItem.genRes);
  };

  const handleRedo = () => {
    if (videoHistory.currentIndex >= videoHistory.urls.length - 1) {
      toast("No more history to redo");
      return;
    }
    
    const newIndex = videoHistory.currentIndex + 1;
    const historyItem = videoHistory.urls[newIndex];
    
    setVideoHistory(prev => ({
      ...prev,
      currentIndex: newIndex
    }));
    
    setCurrentVideoUrl(historyItem.url);
    setCurrentPrompt(historyItem.prompt);
    setCurrentResponse(historyItem.genRes);
  };

  const canUndo = videoHistory.currentIndex > 0;
  const canRedo = videoHistory.currentIndex < videoHistory.urls.length - 1;

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <div className="flex-shrink-0 border-r border-neutral-800">
        <Sidebar />
      </div>

      <div className="flex-1 flex bg-neutral-900">
        <div className="w-3/5 border-neutral-800 h-full">
          <PromptCard onSubmit={handlePromptSubmit} />
        </div>

        <div className="w-2/5">
          <VideoGenerationCard
            currentVideoUrl={currentVideoUrl}
            currentResponse={currentResponse}
            prompt={currentPrompt}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
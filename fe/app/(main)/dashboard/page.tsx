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
  
  // Use ref to store interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to start polling, returns a Promise that resolves when job completes
  const startPolling = (jobId: string): Promise<{ videoUrl: string; genRes: string }> => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return new Promise((resolve, reject) => {
      intervalRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`${BACKEND_BASE_URL}/prompt/${jobId}`, {
            headers: {
              'Content-Type': 'application/json',
              "Authorization": `Bearer ${session?.user?.accessToken}`
            },
          });

          if (!res.data.success) return;

          if (res.data.data?.status === "completed") {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setLoading(false);
            setCurrentVideoUrl(res.data.data?.genUrl);
            resolve({ videoUrl: res.data.data?.genUrl || '', genRes: res.data.data?.genRes || '' });
          } else if (res.data.data.status === 'failed') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setLoading(false);
            toast.error('Video generation failed');
            reject(new Error('Video generation failed'));
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Don't stop polling on network errors, might be temporary
        }
      }, 3000);
    });
  };

  // Function to stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      console.log('Manually stopping polling...');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handlePromptSubmit = async (prompt: string, params: {
    width: number;
    height: number;
    fps: number;
    frameCount: number;
    model: string;
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(body),
      });      
      
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.message);
        setLoading(false);
        return;
      }

      // Set session ID if this is the first prompt
      if (data.data?.chatSessionId) {
        setSessionId(data.data?.chatSessionId);
      }

      // Set current prompt and clear previous data
      setCurrentPrompt(data.data?.prompt || prompt);
      setCurrentResponse(data.data?.genRes || '');
      setCurrentVideoUrl(null);
      setIsFollowUp(true);

      // Start polling and wait for job completion
      if (data.data?.jobId) {
        const pollResult = await startPolling(data.data.jobId);

        // Add to history once video is ready
        const newHistoryItem = {
          url: pollResult.videoUrl,
          prompt: data.data?.prompt || prompt,
          genRes: pollResult.genRes,
        };

        setVideoHistory(prev => {
          const newUrls = prev.urls.slice(0, prev.currentIndex + 1);
          newUrls.push(newHistoryItem);
          return { urls: newUrls, currentIndex: newUrls.length - 1 };
        });

        return {
          videoUrl: pollResult.videoUrl,
          genRes: pollResult.genRes,
          prompt: data.data?.prompt || prompt,
        };
      }

    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to generate video');
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (videoHistory.currentIndex <= 0) {
      toast("No more history to undo");
      return;
    }
    
    // Stop current polling when navigating history
    stopPolling();
    setLoading(false);
    
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
    
    // Stop current polling when navigating history
    stopPolling();
    setLoading(false);
    
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
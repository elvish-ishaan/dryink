'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { BACKEND_BASE_URL } from '@/lib/constants';

const Page = () => {
  const { data: session } = useSession();
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [videoHistory, setVideoHistory] = useState<{
    urls: { url: string; prompt: string; genRes: string }[];
    currentIndex: number;
  }>({
    urls: [],
    currentIndex: -1,
  });

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const callPromptAPI = async (prompt: string, params: {
    width: number;
    height: number;
    fps: number;
    frameCount: number;
  }, isFollowUp: boolean = false) => {
    const endpoint = isFollowUp
      ? `${BACKEND_BASE_URL}/prompt/followUpPrompt`
      : `${BACKEND_BASE_URL}/prompt`;

    const body = isFollowUp
      ? {
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
      throw new Error(data.message || 'Generation failed');
    }

    return {
      videoUrl: data.data.signedUrl,
      genRes: data.data.genRes,
      prompt: data.data.prompt || prompt
    };
  };

  const handlePromptSubmit = async (prompt: string, params: {
    width: number;
    height: number;
    fps: number;
    frameCount: number;
  }, isFollowUp: boolean = false) => {
    setLoading(true);
    try {
      const endpoint = isFollowUp
        ? `${BACKEND_BASE_URL}/prompt/followUpPrompt`
        : `${BACKEND_BASE_URL}/prompt`;

      const body = isFollowUp
        ? {
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
        throw new Error(data.message || 'Generation failed');
      }

      const result = {
        videoUrl: data.data.signedUrl,
        genRes: data.data.genRes,
        prompt: data.data.prompt || prompt
      };

      // Update current state
      setCurrentVideoUrl(result.videoUrl);
      setCurrentResponse(result.genRes);
      setCurrentPrompt(result.prompt);

      // Add to history
      const newUrls = videoHistory.urls.slice(0, videoHistory.currentIndex + 1);
      newUrls.push({
        url: result.videoUrl,
        prompt: result.prompt,
        genRes: result.genRes
      });
      setVideoHistory({
        urls: newUrls,
        currentIndex: newUrls.length - 1
      });

      return result;
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate video');
      throw err;
    } finally {
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
    <div className="flex flex-row h-screen bg-neutral-950 text-white">
      <Sidebar/>
      
      {/* Main Content - adjusted to account for navbar */}
      <div className="flex-1 px-4 py-3 grid gap-3 md:grid-cols-2 grid-cols-1 overflow-hidden bg-neutral-900">
        {/* Left Section */}
        <PromptCard onSubmit={handlePromptSubmit} />

        {/* Right Section */}
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
  );
};

export default Page;
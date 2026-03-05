'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { toast } from 'sonner';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

interface Chat {
  id: string;
  prompt: string;
  responce: string;
  genUrl: string | null;
}

export default function SessionPage() {
  const { data: authSession } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = params.sessionId as string;
  const jobIdFromUrl = searchParams.get('jobId');

  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [loading, setLoading] = useState(!!jobIdFromUrl);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  // Keep currentResponse accessible in polling closure without stale closure issues
  const currentResponseRef = useRef<string>('');

  const fetchSession = async (token: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.chats.length > 0) {
        const lastChat: Chat = data.data.chats[data.data.chats.length - 1];
        setCurrentPrompt(lastChat.prompt);
        setCurrentResponse(lastChat.responce);
        currentResponseRef.current = lastChat.responce;
        if (lastChat.genUrl) {
          setCurrentVideoUrl(lastChat.genUrl);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  };

  const startPolling = (jobId: string, token: string): Promise<void> => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pollCountRef.current = 0;

    return new Promise((resolve, reject) => {
      intervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        if (pollCountRef.current >= 100) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setLoading(false);
          toast.error('Generation timed out');
          reject(new Error('timeout'));
          return;
        }

        try {
          const res = await fetch(`${BACKEND_BASE_URL}/prompt/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (!data.success) return; // still pending

          if (data.data?.status === 'completed') {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setCurrentVideoUrl(data.data.genUrl);
            setLoading(false);
            // Fetch updated session to get latest responce for follow-ups
            await fetchSession(token);
            // Remove jobId from URL without a full navigation
            router.replace(`/dashboard/${sessionId}`, { scroll: false });
            resolve();
          } else if (data.data?.status === 'failed') {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setLoading(false);
            toast.error('Video generation failed');
            reject(new Error('failed'));
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    });
  };

  useEffect(() => {
    const token = authSession?.user?.accessToken;
    if (!token) return;

    fetchSession(token);

    if (jobIdFromUrl) {
      setLoading(true);
      startPolling(jobIdFromUrl, token);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.user?.accessToken, sessionId]);

  const handlePromptSubmit = async (
    prompt: string,
    params: { width: number; height: number; fps: number; frameCount: number; model: string }
  ) => {
    setLoading(true);
    const token = authSession?.user?.accessToken;
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/prompt/followUpPrompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatSessionId: sessionId,
          followUprompt: prompt,
          previousGenRes: currentResponseRef.current,
          ...params,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message);
        setLoading(false);
        return;
      }

      setCurrentPrompt(prompt);
      setCurrentVideoUrl(null);

      if (data.data?.jobId) {
        await startPolling(data.data.jobId, token);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to generate video');
      setLoading(false);
    }
  };

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
            onUndo={() => {}}
            onRedo={() => {}}
            canUndo={false}
            canRedo={false}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { toast } from 'sonner';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export default function SessionPage() {
  const { data: authSession } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = params.sessionId as string;
  const jobIdFromUrl = searchParams.get('jobId');

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [videoHistory, setVideoHistory] = useState<VideoEntry[]>([]);
  const [videoIndex, setVideoIndex] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(!!jobIdFromUrl);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  // Stores the latest generated p5.js code for follow-up context
  const currentCodeRef = useRef<string>('');

  const fetchSession = async (token: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) return;

      const chats: Chat[] = data.data.chats;

      // Rebuild conversation messages from DB chats
      const newMessages: ConversationMessage[] = chats.flatMap((chat) => [
        {
          id: `user-${chat.id}`,
          role: 'user' as const,
          content: chat.prompt,
          status: 'sent' as const,
        },
        {
          id: `asst-${chat.id}`,
          role: 'assistant' as const,
          content: chat.message || 'Animation generated!',
          status: 'sent' as const,
        },
      ]);
      setMessages(newMessages);

      // Rebuild video history from chats that have a generated URL
      const videos: VideoEntry[] = chats
        .filter((c) => c.genUrl)
        .map((c) => ({ url: c.genUrl!, prompt: c.prompt }));
      setVideoHistory(videos);
      if (videos.length > 0) {
        setVideoIndex(videos.length - 1);
      }

      // Keep latest code for follow-up context
      const lastChat = chats[chats.length - 1];
      if (lastChat) {
        currentCodeRef.current = lastChat.responce;
      }

      // Stop loading if the latest chat already has its video
      if (lastChat?.genUrl) {
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  };

  const startPolling = (jobId: string, token: string): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pollCountRef.current = 0;

    intervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current >= 100) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsGenerating(false);
        toast.error('Generation timed out');
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
          // Fetch updated session to get latest genUrl + sync everything
          await fetchSession(token);
          router.replace(`/dashboard/${sessionId}`, { scroll: false });
        } else if (data.data?.status === 'failed') {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsGenerating(false);
          toast.error('Video generation failed');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  useEffect(() => {
    const token = authSession?.user?.accessToken;
    if (!token) return;

    fetchSession(token);

    if (jobIdFromUrl) {
      setIsGenerating(true);
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
    params: { fps: number; model: string }
  ): Promise<void> => {
    const token = authSession?.user?.accessToken;
    if (!token) return;

    const tempAsstId = `asst-temp-${Date.now()}`;

    // Optimistically add user message + pending assistant bubble
    setMessages((prev) => [
      ...prev,
      { id: `user-temp-${Date.now()}`, role: 'user', content: prompt, status: 'sent' },
      { id: tempAsstId, role: 'assistant', content: '', status: 'pending' },
    ]);

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
          previousGenRes: currentCodeRef.current,
          ...params,
        }),
      });

      const data = await response.json();

      if (response.status === 402 || data.code === 'INSUFFICIENT_CREDITS') {
        toast.error("You've run out of credits!", {
          action: { label: 'Buy Credits', onClick: () => router.push('/pricing') },
          duration: 6000,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === tempAsstId ? { ...m, status: 'failed' } : m))
        );
        return;
      }

      if (!data.success) {
        toast.error(data.message);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempAsstId ? { ...m, status: 'failed' } : m))
        );
        return;
      }

      // Show LLM's conversational reply immediately
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAsstId
            ? {
                ...m,
                content: data.data.message || 'Animation is being generated!',
                status: 'sent',
              }
            : m
        )
      );

      setIsGenerating(true);
      startPolling(data.data.jobId, token);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to generate video');
      setMessages((prev) =>
        prev.map((m) => (m.id === tempAsstId ? { ...m, status: 'failed' } : m))
      );
    }
  };

  const currentVideo = videoHistory[videoIndex] ?? null;

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <div className="flex-shrink-0 border-r border-neutral-800">
        <Sidebar />
      </div>

      <div className="flex-1 flex bg-neutral-900">
        <div className="w-3/5">
          <VideoGenerationCard
            currentVideoUrl={currentVideo?.url ?? null}
            currentResponse=""
            prompt={currentVideo?.prompt ?? ''}
            onUndo={() => setVideoIndex((i) => i - 1)}
            onRedo={() => setVideoIndex((i) => i + 1)}
            canUndo={videoIndex > 0}
            canRedo={videoIndex < videoHistory.length - 1}
            loading={isGenerating}
          />
        </div>

        <div className="w-2/5 border-l border-neutral-800 h-full">
          <PromptCard
            messages={messages}
            onSubmit={handlePromptSubmit}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}

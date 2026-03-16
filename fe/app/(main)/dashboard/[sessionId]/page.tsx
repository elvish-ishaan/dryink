'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { toast } from 'sonner';
import { useCredits } from '@/contexts/CreditsContext';
import type { Chat, ConversationMessage, VideoEntry } from '@/types/types';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export default function SessionPage() {
  const { data: authSession } = useSession();
  const params = useParams();
  const router = useRouter();
  const { refreshCredits } = useCredits();

  const sessionId = params.sessionId as string;

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Hybrid rendering state
  const [animationCode, setAnimationCode] = useState<string>('');
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Legacy video history (for sessions that already have genUrl)
  const [videoHistory, setVideoHistory] = useState<VideoEntry[]>([]);
  const [videoIndex, setVideoIndex] = useState(-1);

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

      const lastChat = chats[chats.length - 1];
      if (lastChat) {
        currentCodeRef.current = lastChat.responce;
        // Set animation code for resumed sessions
        setAnimationCode(lastChat.responce);
        setCurrentChatId(lastChat.id);
        if (lastChat.genUrl) {
          setExportedVideoUrl(lastChat.genUrl);
        }
      }

      // Rebuild legacy video history from chats that have a genUrl
      const videos: VideoEntry[] = chats
        .filter((c) => c.genUrl)
        .map((c) => ({ url: c.genUrl!, prompt: c.prompt }));
      setVideoHistory(videos);
      if (videos.length > 0) {
        setVideoIndex(videos.length - 1);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  };

  useEffect(() => {
    const token = authSession?.user?.accessToken;
    if (!token) return;

    // Read instant animation code from sessionStorage (new sessions)
    const storedCode = sessionStorage.getItem(`anim_${sessionId}`);
    const storedChatId = sessionStorage.getItem(`chatId_${sessionId}`);
    if (storedCode && storedChatId) {
      sessionStorage.removeItem(`anim_${sessionId}`);
      sessionStorage.removeItem(`chatId_${sessionId}`);
      setAnimationCode(storedCode);
      setCurrentChatId(storedChatId);
      currentCodeRef.current = storedCode;
    }

    fetchSession(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.user?.accessToken, sessionId]);

  const handlePromptSubmit = async (
    prompt: string,
    params: { fps: number; model: string }
  ): Promise<void> => {
    const token = authSession?.user?.accessToken;
    if (!token) return;

    const tempAsstId = `asst-temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `user-temp-${Date.now()}`, role: 'user', content: prompt, status: 'sent' },
      { id: tempAsstId, role: 'assistant', content: '', status: 'pending' },
    ]);
    setIsGenerating(true);

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
        setIsGenerating(false);
        return;
      }

      if (!data.success) {
        toast.error(data.message);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempAsstId ? { ...m, status: 'failed' } : m))
        );
        setIsGenerating(false);
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAsstId
            ? { ...m, content: data.data.message || 'Animation updated!', status: 'sent' }
            : m
        )
      );

      // Instant re-render — no polling needed
      const { genRes, chatId } = data.data;
      setAnimationCode(genRes);
      setCurrentChatId(chatId);
      setExportJobId(null);
      setExportedVideoUrl(null);
      currentCodeRef.current = genRes;
      setIsGenerating(false);
      refreshCredits();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to generate animation');
      setMessages((prev) =>
        prev.map((m) => (m.id === tempAsstId ? { ...m, status: 'failed' } : m))
      );
      setIsGenerating(false);
    }
  };

  const handleExportRequest = async () => {
    const token = authSession?.user?.accessToken;
    if (!token || !currentChatId) return;

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId: currentChatId, fps: 24 }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to start export');
        return;
      }

      if (data.data.genUrl) {
        // Already completed
        setExportedVideoUrl(data.data.genUrl);
      } else if (data.data.jobId) {
        setExportJobId(data.data.jobId);
      }
    } catch {
      toast.error('Failed to start export');
    }
  };

  const promptColRef = useRef<HTMLDivElement>(null);

  const handleReply = useCallback(() => {
    promptColRef.current?.querySelector('textarea')?.focus();
  }, []);

  const handleExportComplete = useCallback((url: string) => {
    setExportedVideoUrl(url);
    setExportJobId(null);
    toast.success('Video export complete!');
  }, []);

  const currentVideo = videoHistory[videoIndex] ?? null;

  // When showing iframe, pass exportedVideoUrl for "Watch Exported Video" link.
  // When showing legacy video player, pass the history URL.
  const displayVideoUrl = animationCode ? exportedVideoUrl : (currentVideo?.url ?? null);

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <div className="flex-shrink-0 border-r border-neutral-800">
        <Sidebar />
      </div>

      <div className="flex-1 flex bg-neutral-900">
        <div className="w-3/5">
          <VideoGenerationCard
            currentVideoUrl={displayVideoUrl}
            currentResponse=""
            prompt={currentVideo?.prompt ?? ''}
            onUndo={() => setVideoIndex((i) => i - 1)}
            onRedo={() => setVideoIndex((i) => i + 1)}
            canUndo={videoIndex > 0}
            canRedo={videoIndex < videoHistory.length - 1}
            loading={isGenerating}
            animationCode={animationCode}
            exportJobId={exportJobId}
            onExportRequest={handleExportRequest}
            onExportComplete={handleExportComplete}
            onReply={handleReply}
          />
        </div>

        <div ref={promptColRef} className="w-2/5 border-l border-neutral-800 h-full">
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

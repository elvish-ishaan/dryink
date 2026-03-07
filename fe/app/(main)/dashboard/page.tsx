'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

const Page = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePromptSubmit = async (prompt: string, params: { fps: number; model: string }) => {
    const tempAsstId = `asst-temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: prompt, status: 'sent' },
      { id: tempAsstId, role: 'assistant', content: '', status: 'pending' },
    ]);
    setIsGenerating(true);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({ prompt, ...params }),
      });

      const data = await response.json();

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
            ? { ...m, content: data.data.message || 'Animation is being generated!', status: 'sent' }
            : m
        )
      );

      router.push(`/dashboard/${data.data.chatSessionId}?jobId=${data.data.jobId}`);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Failed to generate video');
      setMessages((prev) =>
        prev.map((m) => (m.id === tempAsstId ? { ...m, status: 'failed' } : m))
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <div className="flex-shrink-0 border-r border-neutral-800">
        <Sidebar />
      </div>

      <div className="flex-1 flex bg-neutral-900">
        <div className="w-3/5 border-neutral-800 h-full">
          <VideoGenerationCard
            currentVideoUrl={null}
            currentResponse=""
            prompt=""
            onUndo={() => {}}
            onRedo={() => {}}
            canUndo={false}
            canRedo={false}
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
};

export default Page;

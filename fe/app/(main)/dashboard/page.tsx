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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePromptSubmit = async (prompt: string, params: {
    fps: number;
    model: string;
  }) => {
    setLoading(true);
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
        setLoading(false);
        return;
      }

      // Redirect to the session page; jobId in URL allows polling to resume on refresh
      router.push(`/dashboard/${data.data.chatSessionId}?jobId=${data.data.jobId}`);
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
            currentVideoUrl={null}
            currentResponse=""
            prompt=""
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
};

export default Page;
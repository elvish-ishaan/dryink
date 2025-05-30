'use client';
import Sidebar from '@/components/dashboard/Sidebar';
import PromptCard from '@/components/dashboard/PromptCard';
import VideoGenerationCard from '@/components/dashboard/VideoGenerationCard';
import { useEffect } from 'react';

const Page = () => {

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-row h-screen bg-neutral-950 text-white">
      <Sidebar/>
      
      {/* Main Content - adjusted to account for navbar */}
      <div className="flex-1 px-4 py-3 grid gap-3 md:grid-cols-2 grid-cols-1 overflow-hidden bg-neutral-900">
        {/* Left Section */}
        <PromptCard/>

        {/* Right Section */}
        <VideoGenerationCard/>
      </div>
    </div>
  );
};

export default Page;
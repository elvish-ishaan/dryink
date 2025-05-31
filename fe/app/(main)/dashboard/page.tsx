'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, Loader2, Undo2, Redo2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import InputCard from '@/components/dashboard/InputCard';

type PromptStatus = 'pending' | 'completed' | 'canceled';

interface PromptItem {
  prompt: string;
  status: PromptStatus;
  videoUrl?: string;
  timestamp: number;
  genRes?: string;
}

// Input validation constraints
const MIN_WIDTH = 100;
const MAX_WIDTH = 1920;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 1080;
const MIN_FRAMES = 1;
const MAX_FRAMES = 1000;

const Page = () => {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptItem[]>([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [initPrompt, setInitPrompt] = useState(false);
  const { data: session } = useSession();
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  // const [startVideo, setStartVideo] = useState(false);
  // const [previewAudioStart, setPreviewAudioStart] = useState(false);

  // Parameters with validation
  const [fps, setFps] = useState<number>(30);
  const [frameCount, setFrameCount] = useState<number>(300);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);

  const videoRef = useRef<HTMLVideoElement | null>(null);


  // Undo/Redo state
  const [videoHistory, setVideoHistory] = useState<{
    urls: { url: string; prompt: string; genRes: string }[];
    currentIndex: number;
  }>({
    urls: [],
    currentIndex: -1,
  });

  // Validation errors
  const [errors, setErrors] = useState({
    prompt: '',
    width: '',
    height: '',
    frameCount: ''
  });

  // Adjust layout based on window size
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validateInputs = () => {
    const newErrors = {
      prompt: '',
      width: '',
      height: '',
      frameCount: ''
    };
    
    if (!prompt.trim()) {
      newErrors.prompt = 'Prompt cannot be empty';
    }
    
    if (width < MIN_WIDTH || width > MAX_WIDTH) {
      newErrors.width = `Width must be between ${MIN_WIDTH} and ${MAX_WIDTH}`;
    }
    
    if (height < MIN_HEIGHT || height > MAX_HEIGHT) {
      newErrors.height = `Height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT}`;
    }
    
    if (frameCount < MIN_FRAMES || frameCount > MAX_FRAMES) {
      newErrors.frameCount = `Frame count must be between ${MIN_FRAMES} and ${MAX_FRAMES}`;
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };

  const addToVideoHistory = (url: string, promptText: string, genResText: string) => {
    // Remove any "future" history if we're not at the latest point
    const newUrls = videoHistory.urls.slice(0, videoHistory.currentIndex + 1);
    
    // Add the new URL to history
    newUrls.push({ url, prompt: promptText, genRes: genResText });
    
    // Update the history state
    setVideoHistory({
      urls: newUrls,
      currentIndex: newUrls.length - 1
    });
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
    setPrompt(historyItem.prompt);
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
    setPrompt(historyItem.prompt);
    setCurrentResponse(historyItem.genRes);
  };

  const handlePrompt = async (isFollowUp = false) => {
    if (!validateInputs()) {
      Object.values(errors).forEach(error => {
        if (error) toast.error(error);
      });
      return;
    }

    const timestamp = Date.now();
    const newPrompt: PromptItem = {
      prompt,
      status: 'pending',
      timestamp,
    };
    setPromptHistory((prev) => [ ...prev, newPrompt]);
    setLoading(true);

    const endpoint = isFollowUp
      ? `${BACKEND_BASE_URL}/prompt/followUpPrompt`
      : `${BACKEND_BASE_URL}/prompt`;

    const body = isFollowUp
      ? {
          chatSessionId,
          followUprompt: prompt,
          previousGenRes: currentResponse,
          height,
          width,
          fps,
          frameCount,
        }
      : {
          prompt,
          height,
          width,
          fps,
          frameCount,
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${session?.user?.accessToken}` }, 
        body: JSON.stringify(body),
      });
      console.log(response,'getting response from be')

      const data = await response.json();
      console.log(data,'getting data from be')
      setLoading(false);

      if (data.success) {
        if(!isFollowUp){
          setChatSessionId(data.data?.chatSessionId)
        }
        const videoUrl = data.data?.signedUrl;
        const genRes = data.data?.genRes;
        const returnedPrompt = data.data?.prompt || prompt;
        
        setCurrentVideoUrl(videoUrl);
        setCurrentResponse(genRes);
        setPrompt(returnedPrompt);
        setInitPrompt(true);

        // Add to undo/redo history
        addToVideoHistory(videoUrl, returnedPrompt, genRes);

        setPromptHistory((prev) =>
          prev.map((item) =>
            item.timestamp === timestamp
              ? { ...item, status: 'completed', videoUrl, genRes }
              : item
          )
        );
      } else {
        setPromptHistory((prev) =>
          prev.map((item) =>
            item.timestamp === timestamp ? { ...item, status: 'canceled' } : item
          )
        );
        toast.error('Generation failed');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      toast.error('Something went wrong');
      setPromptHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp ? { ...item, status: 'canceled' } : item
        )
      );
    }
  };

  const handleDownload = () => {
    if (!currentVideoUrl) return;
    const a = document.createElement('a');
    a.href = currentVideoUrl;
    a.download = 'generated-video.mp4';
    a.click();
  };

  const canUndo = videoHistory.currentIndex > 0;
  const canRedo = videoHistory.currentIndex < videoHistory.urls.length - 1;

  //handing video atuoplay when recorder started
  // useEffect(() => {
  //   if (startVideo) {
  //     const video = document.querySelector('video') as HTMLVideoElement;
  //     video.play();
  //   }
  // }, [startVideo]);

  //handling prevew
  // const handlePreview = () => {
  //   setPreviewAudioStart(true);
  // };

  // Effect to play the video when previewAudioStart becomes true
  // useEffect(() => {
  //   if (previewAudioStart && videoRef.current) {
  //     videoRef.current.play();
  //   }
  // }, [previewAudioStart]);

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white">
      
      
      {/* Main Content - adjusted to account for navbar */}
      <div className="flex-1 px-4 py-3 grid gap-3 md:grid-cols-2 grid-cols-1 overflow-hidden">
        {/* Left Section */}
        <Card className="flex flex-col overflow-hidden h-full">
          <CardHeader className="py-3">
            <CardTitle>Prompt History</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col min-h-0 gap-3 p-3 overflow-hidden">
            {/* Chat History */}
            <ScrollArea className="flex-1 rounded-md border p-2 min-h-0 overflow-auto">
              {promptHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No prompts yet.</p>
              ) : (
                promptHistory.map((item) => (
                  <div
                    key={item.timestamp}
                    className={clsx(
                      'p-2 rounded-md shadow-sm border text-sm mb-2',
                      item.status === 'completed' && 'border-green-500',
                      item.status === 'pending' && 'border-yellow-500 font-bold italic',
                      item.status === 'canceled' && 'border-red-500'
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground max-w-[80%] truncate">{item.prompt}</p>
                      <Badge
                        variant={
                          item.status === 'completed'
                            ? 'default'
                            : item.status === 'pending'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {item.status === 'pending' ? 'Generating' : item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>

            {/* Prompt Input */}
            <InputCard/>
          </CardContent>
        </Card>

        {/* Right Section */}
        <Card className="flex flex-col items-center justify-center overflow-hidden h-full">
          <CardContent className="flex flex-col items-center justify-center w-full h-full p-4 gap-3">
            {loading ? (
              <Skeleton className="w-full max-w-3xl aspect-video rounded-md" />
            ) : currentVideoUrl ? (
              <>
                <div className="w-full max-w-3xl overflow-hidden rounded-md shadow-lg">
                  <video
                    ref={videoRef}
                    key={currentVideoUrl}
                    src={currentVideoUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                </div>
                {/* <Button onClick={handlePreview}>Preview</Button>
                <AudioRecorder setStartVideo={setStartVideo}
                previewAudioStart={previewAudioStart}
                /> */}
                <div className="flex gap-2 w-full max-w-3xl justify-center">
                  <Button 
                    onClick={handleUndo} 
                    variant="outline" 
                    size="sm"
                    disabled={!canUndo}
                    className={!canUndo ? "opacity-50" : ""}
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    onClick={handleRedo} 
                    variant="outline" 
                    size="sm"
                    disabled={!canRedo}
                    className={!canRedo ? "opacity-50" : ""}
                  >
                    <Redo2 className="w-4 h-4 mr-1" />
                    Redo
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {videoHistory.currentIndex + 1} of {videoHistory.urls.length} generations
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full">
                <p className="text-muted-foreground text-sm">Generated video will appear here</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter a prompt and adjust parameters to generate a video
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
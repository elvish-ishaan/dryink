"use client";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_BASE_URL } from "@/lib/constants";
import AnimatedPromptInput from "./AnimatedPrompt";
import { PromptItem } from "@/types/types";


// Input validation constraints
const MIN_WIDTH = 100;
const MAX_WIDTH = 1920;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 1080;
const MIN_FRAMES = 1;
const MAX_FRAMES = 1000;

export type ErrorState = {
    prompt: string;
    width: string;
    height: string;
    frameCount: string;
  };


export default function InputCard() {

    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [width, setWidth] = useState<number>(800);
    const [height, setHeight] = useState<number>(600);
    const [fps, setFps] = useState<number>(30);
    const [frameCount, setFrameCount] = useState<number>(300);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const [currentResponse, setCurrentResponse] = useState<string>('');

    const [videoHistory, setVideoHistory] = useState<{
        urls: { url: string; prompt: string; genRes: string }[];
        currentIndex: number;
      }>({
        urls: [],
        currentIndex: -1,
      });

    const [initPrompt, setInitPrompt] = useState(false);

    const [errors, setErrors] = useState<ErrorState>({
        prompt: '',
        width: '',
        height: '',
        frameCount: ''
      });
      

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          console.log(response,'getting response from be')
    
          const data = await response.json();
          console.log(data,'getting data from be')
          setLoading(false);
    
          if (data.success) {
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
    const [promptHistory, setPromptHistory] = useState<PromptItem[]>([]);

    return(
        <div className="space-y-2">
            <AnimatedPromptInput 
            prompt={prompt}
            setPrompt={setPrompt}
            errors={errors}
            setErrors={setErrors}
            loading={loading}
            />
              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="space-y-1">
                <div className="relative">
                <Input
                    type="number"
                    min={MIN_WIDTH}
                    max={MAX_WIDTH}
                    value={width}
                    onChange={(e) => {
                    const val = +e.target.value;
                    setWidth(val);
                    if (val >= MIN_WIDTH && val <= MAX_WIDTH) {
                        setErrors(prev => ({ ...prev, width: '' }));
                    }
                    }}
                    placeholder="Width"
                    className={cn(
                    "w-full",
                    errors.width && "border-red-500 focus-visible:ring-red-500"
                    )}
                />
                {errors.width && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="truncate">{errors.width}</span>
                    </div>
                )}
                </div>
                <div className="text-xs text-muted-foreground">
                Width ({MIN_WIDTH}-{MAX_WIDTH})
                </div>
            </div>
            
            <div className="space-y-1">
                <div className="relative">
            <Input
                    type="number"
                    min={MIN_HEIGHT}
                    max={MAX_HEIGHT}
                    value={height}
                    onChange={(e) => {
                    const val = +e.target.value;
                    setHeight(val);
                    if (val >= MIN_HEIGHT && val <= MAX_HEIGHT) {
                        setErrors(prev => ({ ...prev, height: '' }));
                    }
                    }}
                    placeholder="Height"
                    className={cn(
                    "w-full",
                    errors.height && "border-red-500 focus-visible:ring-red-500"
                    )}
                />
                {errors.height && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="truncate">{errors.height}</span>
                    </div>
                )}
                </div>
                <div className="text-xs text-muted-foreground">
                Height ({MIN_HEIGHT}-{MAX_HEIGHT})
                </div>
            </div>
            
            <div className="space-y-1">
                <Select 
                onValueChange={(v) => setFps(Number(v))} 
                defaultValue={String(fps)}
                >
                <SelectTrigger className="w-full ">
                    <SelectValue placeholder="FPS" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 ">
                    {[24, 30, 60].map((f) => (
                    <SelectItem className="hover:bg-neutral-700" key={f} value={String(f)}>
                        {f} FPS
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                Frames Per Second
                </div>
            </div>
            
            <div className="space-y-1">
                <div className="relative">
                <Input
                    type="number"
                    min={MIN_FRAMES}
                    max={MAX_FRAMES}
                    value={frameCount}
                    onChange={(e) => {
                    const val = +e.target.value;
                    setFrameCount(val);
                    if (val >= MIN_FRAMES && val <= MAX_FRAMES) {
                        setErrors(prev => ({ ...prev, frameCount: '' }));
                    }
                    }}
                    className={cn(
                    "w-full",
                    errors.frameCount && "border-red-500 focus-visible:ring-red-500"
                    )}
                    placeholder="Frames"
                />
                {errors.frameCount && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="truncate">{errors.frameCount}</span>
                    </div>
                )}
                </div>
                <div className="text-xs text-muted-foreground">
                Frame Count ({MIN_FRAMES}-{MAX_FRAMES})
                </div>
            </div>
            </div>
              
            <div className="flex gap-2">
            <Button 
            disabled={loading} 
            onClick={() => handlePrompt(initPrompt)} 
            className="flex-1 relative overflow-hidden mt-3"
            >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initPrompt ? 'Follow-up' : 'Generate'}

            {/* Glow Effect */}
            {/* <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2 w-4/5 mx-auto bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-md opacity-70 animate-pulse" /> */}
            <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
            </Button>

            </div>
        </div>
    )
}
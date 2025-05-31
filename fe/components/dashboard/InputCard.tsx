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

interface InputCardProps {
    onSubmit: (prompt: string, params: {
        width: number;
        height: number;
        fps: number;
        frameCount: number;
    }, isFollowUp?: boolean) => Promise<{
        videoUrl: string;
        genRes: string;
        prompt: string;
    }>;
}

export default function InputCard({ onSubmit }: InputCardProps) {
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

    const handleSubmit = async (isFollowUp = false) => {
        if (!validateInputs()) {
            Object.values(errors).forEach(error => {
                if (error) toast.error(error);
            });
            return;
        }

        setLoading(true);
        try {
            const result = await onSubmit(prompt, {
                width,
                height,
                fps,
                frameCount
            }, isFollowUp);

            // Reset form after successful submission
            if (!isFollowUp) {
                setPrompt('');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate video');
        } finally {
            setLoading(false);
        }
    };

    return (
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
                value={fps.toString()}
                onValueChange={(value) => setFps(+value)}
                >
                <SelectTrigger className="w-full ">
                    <SelectValue placeholder="FPS" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 ">
                    <SelectItem className="hover:bg-neutral-700" value="24">24 FPS</SelectItem>
                    <SelectItem className="hover:bg-neutral-700" value="30">30 FPS</SelectItem>
                    <SelectItem className="hover:bg-neutral-700" value="60">60 FPS</SelectItem>
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
              
            <div className="flex gap-2 justify-end">
            <Button 
            onClick={() => handleSubmit(true)}
            variant="outline"
            disabled={loading}
            >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                'Follow Up'
            )}
            </Button>

            <Button 
            onClick={() => handleSubmit(false)}
            disabled={loading}
            >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                'Generate'
            )}
            </Button>
            </div>
        </div>
    )
}
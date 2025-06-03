"use client";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import AnimatedPromptInput from "./AnimatedPrompt";


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

interface OnSubmit {
    success: boolean;
    data: {
        chatSessionId: string;
        signedUrl: string;
        prompt: string;
        genRes: string;
    }
}


interface InputCardProps {
    onSubmit: (prompt: string, params: {
        width: number;
        height: number;
        fps: number;
        frameCount: number;
    }) => Promise<OnSubmit>;
}

export default function     InputCard({ onSubmit }: InputCardProps) {
    const [prompt, setPrompt] = useState('');
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [fps, setFps] = useState(24);
    const [frameCount, setFrameCount] = useState(200);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({
        prompt: '',
        width: '',
        height: '',
        frameCount: ''
      });

    const validateInputs = () => {
        const newErrors: ErrorState = {
            prompt: '',
            width: '',
            height: '',
            frameCount: ''
        };

        if (!prompt.trim()) {
            newErrors.prompt = 'Prompt is required';
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
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = async () => {
        if (!validateInputs()) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit(prompt, {
                width,
                height,
                fps,
                frameCount
            });
            setPrompt('');
        } catch (error) {
            console.error('Failed to submit prompt:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2 mt-3">
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
                <div className="text-xs text-neutral-300">
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
                <div className="text-xs text-neutral-300">
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
                <div className="text-xs text-neutral-300">
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
                <div className="text-xs text-neutral-300">
                Frame Count ({MIN_FRAMES}-{MAX_FRAMES})
                </div>
            </div>
            </div>
              
            <div className="flex justify-end">
            <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
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
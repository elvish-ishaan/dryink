"use client";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { useState, useEffect, useRef } from "react";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
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

interface OpenRouterModel {
    id: string;
    name: string;
}

interface InputCardProps {
    onSubmit: (prompt: string, params: {
        width: number;
        height: number;
        fps: number;
        frameCount: number;
        model: string;
    }) => Promise<OnSubmit>;
}

export default function InputCard({ onSubmit }: InputCardProps) {
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

    const [model, setModel] = useState<string>('');
    const [modelQuery, setModelQuery] = useState('');
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch all available models from OpenRouter
    useEffect(() => {
        fetch('https://openrouter.ai/api/v1/models')
            .then(r => r.json())
            .then(data => {
                if (data.data) {
                    const sorted = (data.data as OpenRouterModel[])
                        .map(m => ({ id: m.id, name: m.name }))
                        .sort((a, b) => a.id.localeCompare(b.id));
                    setModels(sorted);
                }
            })
            .catch(console.error);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredModels = models.filter(m =>
        m.id.toLowerCase().includes(modelQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(modelQuery.toLowerCase())
    ).slice(0, 40);

    const handleModelSelect = (m: OpenRouterModel) => {
        setModel(m.id);
        setModelQuery(m.id);
        setDropdownOpen(false);
    };

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
                frameCount,
                model,
            });
            setPrompt('');
        } catch (error) {
            console.error('Failed to submit prompt:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 mt-3">
          <AnimatedPromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            errors={errors}
            setErrors={setErrors}
            loading={loading}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Width input */}
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
                  className={cn("w-full", errors.width && "border-red-500 focus-visible:ring-red-500")}
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

            {/* Height input */}
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
                  className={cn("w-full", errors.height && "border-red-500 focus-visible:ring-red-500")}
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

            {/* FPS Select */}
            <div className="space-y-1">
              <Select value={fps.toString()} onValueChange={(value) => setFps(+value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="FPS" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800">
                  <SelectItem className="hover:bg-neutral-700" value="24">24 FPS</SelectItem>
                  <SelectItem className="hover:bg-neutral-700" value="30">30 FPS</SelectItem>
                  <SelectItem className="hover:bg-neutral-700" value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-neutral-300">Frames Per Second</div>
            </div>

            {/* Frame Count */}
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
                  placeholder="Frames"
                  className={cn("w-full", errors.frameCount && "border-red-500 focus-visible:ring-red-500")}
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

          {/* Bottom row: model pill + generate button */}
          <div className="flex items-center gap-2">
            {/* Model selector — pill trigger, dropdown opens upward */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-neutral-700 hover:bg-neutral-600 text-xs text-neutral-200 border border-neutral-600 transition-colors"
              >
                <span className="max-w-[160px] truncate">
                  {model ? model.split('/').pop() : 'Select model'}
                </span>
                <ChevronDown className={cn("h-3 w-3 flex-shrink-0 transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {/* Dropdown — opens upward */}
              {dropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 z-50 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden">
                  {/* Search inside panel */}
                  <div className="p-2 border-b border-neutral-700">
                    <Input
                      autoFocus
                      value={modelQuery}
                      onChange={(e) => setModelQuery(e.target.value)}
                      placeholder="Search models..."
                      className="h-7 text-xs bg-neutral-900 border-neutral-600 focus-visible:ring-0"
                    />
                  </div>
                  {/* Model list */}
                  <div className="max-h-52 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-neutral-500 text-center">
                        {models.length === 0 ? 'Loading...' : 'No models found'}
                      </p>
                    ) : (
                      filteredModels.map(m => (
                        <div
                          key={m.id}
                          onMouseDown={(e) => { e.preventDefault(); handleModelSelect(m); }}
                          className={cn(
                            "px-3 py-2 cursor-pointer text-sm hover:bg-neutral-700 transition-colors",
                            model === m.id && "bg-neutral-700 text-white font-medium"
                          )}
                        >
                          {m.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Generate button fills remaining width */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
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
      );

}

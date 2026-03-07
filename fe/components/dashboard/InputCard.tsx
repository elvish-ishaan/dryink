"use client";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import AnimatedPromptInput from "./AnimatedPrompt";

const FPS_OPTIONS = [
  { label: 'Slow', value: 15 },
  { label: 'Medium', value: 24 },
  { label: 'Fast', value: 30 },
] as const;

export type ErrorState = {
    prompt: string;
};

interface OpenRouterModel {
    id: string;
    name: string;
}

interface InputCardProps {
    onSubmit: (prompt: string, params: {
        fps: number;
        model: string;
    }) => Promise<void>;
    disabled?: boolean;
}

export default function InputCard({ onSubmit, disabled = false }: InputCardProps) {
    const [prompt, setPrompt] = useState('');
    // fpsIndex: 0=Slow(15), 1=Medium(24), 2=Fast(30)
    const [fpsIndex, setFpsIndex] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({ prompt: '' });

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
        const newErrors: ErrorState = { prompt: '' };
        if (!prompt.trim()) {
            newErrors.prompt = 'Prompt is required';
        }
        setErrors(newErrors);
        return !newErrors.prompt;
    };

    const handleSubmit = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        try {
            await onSubmit(prompt, {
                fps: FPS_OPTIONS[fpsIndex].value,
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

          {/* FPS slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span>Speed</span>
              <span className="font-medium text-white">
                {FPS_OPTIONS[fpsIndex].label} ({FPS_OPTIONS[fpsIndex].value} fps)
              </span>
            </div>
            <div className="relative px-1">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={fpsIndex}
                onChange={(e) => setFpsIndex(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-600 accent-white"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Slow</span>
                <span>Medium</span>
                <span>Fast</span>
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
              disabled={loading || disabled}
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

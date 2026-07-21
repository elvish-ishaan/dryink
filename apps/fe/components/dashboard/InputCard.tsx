"use client";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import AnimatedPromptInput from "./AnimatedPrompt";
import ModelPicker from "../herosection/ModelPicker";
import type { ErrorState } from "@/types/types";
import { useSelectedModel } from "@/hooks/useSelectedModel";

interface InputCardProps {
    onSubmit: (prompt: string, params: {
        model: string;
    }) => Promise<void>;
    disabled?: boolean;
    prefillPrompt?: string;
}

export default function InputCard({ onSubmit, disabled = false, prefillPrompt }: InputCardProps) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({ prompt: '', width: '', height: '', frameCount: '' });

    useEffect(() => {
        if (prefillPrompt) setPrompt(prefillPrompt);
    }, [prefillPrompt]);

    const [model, setModel] = useSelectedModel();

    const validateInputs = () => {
        const newErrors: ErrorState = { prompt: '', width: '', height: '', frameCount: '' };
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

          {/* Bottom row: model pill + generate button */}
          <div className="flex items-center gap-2">
            {/* Model selector — dropdown opens upward */}
            <ModelPicker
              model={model}
              onSelect={setModel}
              triggerClassName="h-9 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            />

            {/* Generate button fills remaining width */}
            <Button
              onClick={handleSubmit}
              disabled={loading || disabled}
              className="flex-1 rounded-full bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 font-nav font-medium"
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

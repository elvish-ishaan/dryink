"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea"; 
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils"; 
import { placeholders } from "@/lib/promptData";
import { AnimatedPromptInputProps } from "@/types/types";


export default function AnimatedPromptInput({ prompt, setPrompt, errors, setErrors, loading } : AnimatedPromptInputProps) {

    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [visible, setVisible] = useState(true);
  
    useEffect(() => {
        const showDuration = 2000; 
        const animateOutDuration = 600; 
      
        const interval = setInterval(() => {
          setVisible(false); 
          setTimeout(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
            setVisible(true);
          }, animateOutDuration);
        }, showDuration + animateOutDuration);
                
        return () => clearInterval(interval);
        }, []);
  
    return (
        <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (e.target.value.trim()) {
              setErrors((prev) => ({ ...prev, prompt: "" }));
            }
          }}
          className={cn(
            "min-h-[60px] resize-none pr-2",
            errors.prompt && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={loading}
        />
      
        {/* Animated Placeholder Overlay */}
        {prompt === "" && (
          <div className="pointer-events-none absolute mx-auto left-3 flex justify-center items-center top-3 text-neutral-200 text-md">
            <AnimatePresence mode="wait">
              {visible && (
                <motion.div
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6 }}
                >
                  {placeholders[placeholderIndex]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      
        {/* Error Message */}
        <AnimatePresence>
          {errors.prompt && (
            <motion.div
              className="flex items-center mt-1 text-xs text-red-500"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.4 }}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.prompt}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
    );
  }
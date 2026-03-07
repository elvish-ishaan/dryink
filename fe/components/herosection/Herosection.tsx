"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAnimate, stagger } from "motion/react";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import NotBacked from "./NotBacked";

const HeroSection = () => {
  const [scope, animate] = useAnimate();
  const router = useRouter();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const startAnimating = async () => {
    await animate(
      ".animate",
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
      },
      {
        duration: 0.4,
        ease: "easeInOut",
        delay: stagger(0.2),
      }
    );

    animate(
      ".animate-button",
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        scale: [0.8, 1],
      },
      {
        type: "spring",
        stiffness: 300,
        damping: 20,
      }
    );
    };
  //call func
  startAnimating();
}, [animate]);

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      textareaRef.current?.focus();
      return;
    }
    sessionStorage.setItem("pendingPrompt", trimmed);
    if (session?.user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <section
      ref={scope}
      className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-black dark:text-white px-6 py-16 relative overflow-hidden"
      aria-label="Hero section introducing Richat AI assistant"
    >
      {/* Purple Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <div className="w-[550px] h-[550px] bg-[#4a3294] rounded-full blur-[60px] opacity-90 mb-20 hidden dark:block" />
      </div>

      <div className="max-w-4xl w-full text-center relative z-10 mt-10">
        <NotBacked
            className="animate-button "
            style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px) " }}
          />
        {/* Animated Text */}
        <p
          className="animate text-sm tracking-widest text-purple-700 dark:text-white uppercase mb-4"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          Empower education through AI-driven animation.
        </p>
        <h1
          className="animate text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-neutral-700 dark:text-white"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          Where Ideas Turn into Animated Lessons
        </h1>
        <p
          className="animate max-w-xl mx-auto mb-8 mt-10 text-violet-600 dark:text-violet-400"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          Easily turn lessons into engaging, animated videos. Dryink helps you simplify complex ideas through dynamic visuals — no animation skills needed.
        </p>

        {/* Prompt Input */}
        <div
          className="animate-button max-w-2xl mx-auto"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          <div className="relative flex items-end gap-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-xl">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Explain the Pythagorean theorem with an animated triangle..."
              rows={4}
              className="flex-1 resize-none bg-transparent border-0 outline-none text-base text-neutral-800 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 leading-relaxed"
            />
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white h-12 w-12 p-0 disabled:opacity-40"
              aria-label="Generate animation"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Press Enter to generate · Shift+Enter for new line</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

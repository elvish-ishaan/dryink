"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnimate, stagger } from "motion/react";
import { useSession } from "next-auth/react";
import { ArrowUp, Mic, Paperclip, Search, Sparkles, Star } from "lucide-react";

const MAX_PROMPT_LENGTH = 3000;
const HERO_BACKGROUND_IMAGE =
  "https://res.cloudinary.com/diqurtmad/image/upload/v1784374378/wallpapersden.com_forest-sky-fog_4496x3000_l4p8ho.jpg";

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
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center px-6 md:px-[120px]"
      aria-label="Hero section introducing Dryink AI video assistant"
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${HERO_BACKGROUND_IMAGE})` }}
      />
      {/* Light scrim, just enough for black text/content to stay legible over the image */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/30 via-white/5 to-white/35 pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center -mt-[50px]">
        {/* Badge */}
        <div
          className="animate-button inline-flex items-center rounded-full shadow-md overflow-hidden mb-[34px]"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          <span className="flex items-center gap-1.5 bg-[#0e1311] text-white px-4 py-2 text-sm font-nav font-medium">
            <Star className="h-3.5 w-3.5 fill-current" />
            New
          </span>
          <span className="bg-white/80 backdrop-blur px-4 py-2 text-sm font-badge text-black">
            Discover what&apos;s possible
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate font-heading font-bold text-black leading-none tracking-[-2px] md:tracking-[-4.8px] text-5xl sm:text-6xl md:text-8xl mb-[34px]"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          Turn Ideas Into
          <br />
          Animated Videos
        </h1>

        {/* Subtitle */}
        <p
          className="animate font-heading font-medium text-black/70 text-lg md:text-xl tracking-[-0.4px] max-w-[736px] mb-[44px]"
          style={{ color: "#505050", opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          Describe what you want to explain, and Dryink generates a polished
          animated video in seconds — no design or animation skills needed.
        </p>

        {/* Search / prompt box */}
        <div
          className="animate-button w-full max-w-[728px] rounded-[18px] p-3 backdrop-blur-md shadow-2xl"
          style={{
            backgroundColor: "rgba(0,0,0,0.24)",
            opacity: 0,
            filter: "blur(4px)",
            transform: "translateY(20px)",
          }}
        >
          {/* Top row: plan + model */}
          <div className="flex items-center justify-between px-2 pb-2 font-nav font-medium text-xs text-white">
            <div className="flex items-center gap-2">
              <span>Free plan</span>
              <Link
                href="/pricing"
                className="rounded-md px-2 py-0.5 text-[#0e1311] font-semibold"
                style={{ backgroundColor: "rgba(90,225,76,0.89)" }}
              >
                Upgrade
              </Link>
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Powered by Dryink AI</span>
            </div>
          </div>

          {/* Main input */}
          <div className="flex items-end gap-3 rounded-xl bg-white p-3 shadow-md">
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
              maxLength={MAX_PROMPT_LENGTH}
              placeholder="Explain the Pythagorean theorem with an animated triangle..."
              rows={2}
              className="flex-1 resize-none border-0 bg-transparent text-base leading-relaxed text-black outline-none placeholder:text-black/60"
            />
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="h-9 w-9 shrink-0 rounded-full bg-black p-0 text-white hover:bg-black/80 disabled:opacity-40"
              aria-label="Generate animation"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Bottom row: decorative actions + counter */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-nav font-medium text-white">
                <Paperclip className="h-3.5 w-3.5" />
                Attach
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-nav font-medium text-white">
                <Mic className="h-3.5 w-3.5" />
                Voice
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-nav font-medium text-white">
                <Search className="h-3.5 w-3.5" />
                Prompts
              </span>
            </div>
            <span className="text-xs text-white/70">
              {prompt.length}/{MAX_PROMPT_LENGTH.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

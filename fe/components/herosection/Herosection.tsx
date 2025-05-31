"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAnimate, stagger } from "framer-motion";

const HeroSection = () => {
  const [scope, animate] = useAnimate();
  const router = useRouter();

  useEffect(() => {
    startAnimating();
  }, []);

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

    // Animate button with spring bounce
    animate(
      ".animate-button",
      { opacity: 1, filter: "blur(0px)", y: 0, scale: 1 },
      {
        type: "spring",
        stiffness: 300,
        damping: 20,
      }
    );
  };

  return (
    <section
      ref={scope}
      className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-black dark:text-white px-6 py-16 relative overflow-hidden"
      aria-label="Hero section introducing Richat AI assistant"
    >
      {/* Purple Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <div className="w-[450px] h-[450px] bg-[#4a3294] rounded-full blur-[60px] opacity-90 mb-20 hidden dark:block" />
      </div>

      <div className="max-w-4xl text-center relative z-10">
        {/* Animated Text */}
        <p
          className="animate text-sm tracking-widest text-purple-700 dark:text-white uppercase mb-4"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          RICHAT AI ASSISTANT PLATFORM
        </p>
        <h1
          className="animate text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-neutral-700 dark:text-white"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          Personal AI assistant
          <br />
          for business automation
          <br />
          and growth
        </h1>
        <p
          className="animate max-w-xl mx-auto mb-8 mt-12 text-violet-600 dark:text-violet-400"
          style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px)" }}
        >
          RiChat is an innovative AI-powered assistant that helps businesses
          automate processes, improve customer service, and drive conversions.
        </p>

        {/* Animated Button */}
        <div className="space-x-4 flex justify-center flex-wrap gap-4">
          <Button
            onClick={() => router.push("/dashboard")}
            className="animate-button mt-5 cursor-pointer bg-gradient-to-r from-violet-500 to-purple-500 hover:bg-purple-700 text-white px-12 py-6 rounded-full text-sm font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400"
            aria-label="Get a demo of Richat AI"
            style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px) scale(0.8)" }}
          >
            Get a demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

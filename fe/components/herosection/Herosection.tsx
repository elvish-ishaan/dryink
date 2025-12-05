"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAnimate, stagger } from "framer-motion";
import NotBacked from "./NotBacked";

const HeroSection = () => {
  const [scope, animate] = useAnimate();
  const router = useRouter();

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

      <div className="max-w-4xl text-center relative z-10 mt-10">
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

        {/* Animated Button + NotBacked Together */}
        <div className="space-y-4 flex flex-col items-center justify-center flex-wrap">
          <Button
            onClick={() => router.push("/dashboard")}
            className="animate-button w-fit cursor-pointer bg-gradient-to-r from-violet-500
             to-purple-500 hover:bg-purple-700 text-white px-12 py-6 rounded-full text-sm 
             font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400
             border border-neutral-200 dark:border-neutral-600
            backdrop-blur-lg"
            aria-label="Get started with Dryink"
            style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(20px) " }}
          >
            Get started
          </Button>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;

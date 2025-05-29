import React from "react";
import { Button } from "@/components/ui/button";


const HeroSection = () => {
  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-black dark:text-white px-6 py-16 relative overflow-hidden">
      {/* Purple Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="w-[450px] h-[450px] bg-[#4a3294] rounded-full blur-[60px] opacity-90 mb-20 hidden dark:block"></div>
      </div>

      <div className="max-w-4xl text-center relative z-10">
        {/* Text Content */}
        <p className="text-sm tracking-widest text-purple-700 dark:text-white uppercase mb-4">
          RICHAT AI ASSISTANT PLATFORM
        </p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-neutral-700 dark:text-white ">
          Personal AI assistant
          <br />
          for business automation
          <br />
          and growth
        </h1>
        <p className=" dark:text-gray-300 max-w-xl mx-auto mb-8 mt-12 text-violet-500 ">
          RiChat is an innovative AI-powered assistant that helps businesses
          automate processes, improve customer service, and drive conversions.
        </p>
        <div className="space-x-4">
          <Button
            variant={"outline"}
            className=" mt-5 cursor-pointer hover:bg-neutral-700 border-2 border-neutral-600  text-black hover:text-white px-12 py-6 rounded-full text-sm font-semibold drak:text-white dark:hover:bg-neutral-900 dark:bg-white dark:hover:border-neutral-500"
          >
            Get started
          </Button>
          <Button className=" mt-5 cursor-pointer bg-gradient-to-r from-violet-500 to-purple-500 hover:bg-purple-700  text-white px-12 py-6 rounded-full text-sm font-semibold">
            Get a demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

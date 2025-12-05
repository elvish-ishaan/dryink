"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; // Assuming you have shadcn button
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASectionContained() {
  return (
    <section className="relative w-full py-24 overflow-hidden bg-[#0a0a0a]">
      {/* Background Gradients/Glows (These still span the full screen for atmosphere) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Central Purple Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4a3294]/20 rounded-full blur-[120px]" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* THE CONTAINED CTA CARD */}
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#121212] p-8 md:p-12 shadow-2xl border border-neutral-800">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
            >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-[#4a3294]/10 border border-[#4a3294]/20 text-[#a78bfa] text-sm font-medium">
                    <Sparkles size={14} />
                    <span>Start Creating for Free</span>
                </div>

                {/* Headline */}
                <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight text-white mb-6">
                    Ready to bring your ideas to life?
                </h2>

                {/* Subtext */}
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Join thousands of creators, educators, and marketers using Dryink to turn text into stunning video animations in seconds.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-[#4a3294] hover:bg-[#3b2875] text-white font-semibold h-12 px-8 rounded-full text-base transition-all hover:scale-105"
                    >
                        Get Started for Free
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full sm:w-auto border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:text-white h-12 px-8 rounded-full text-base group"
                    >
                        Request Demo
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                {/* Social Proof / Trust signal text */}
                <p className="mt-8 text-sm text-neutral-500">
                    No credit card required · 14-day free trial · Cancel anytime
                </p>
            </motion.div>
        </div>
      </div>
    </section>
  );
}
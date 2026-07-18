"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button"; // Assuming you have shadcn button
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASectionContained() {
  return (
    <section className="relative w-full py-24 overflow-hidden bg-white px-6 md:px-[120px]">
      {/* Background Gradients/Glows (These still span the full screen for atmosphere) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Central Purple Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4a3294]/10 rounded-full blur-[120px]" />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* THE CONTAINED CTA CARD */}
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#f8f8f8] p-8 md:p-12 shadow-xl border border-neutral-200">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
            >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-[#0e1311] text-white text-sm font-badge shadow-sm">
                    <Sparkles size={14} className="text-[#a78bfa]" />
                    <span>Start Creating for Free</span>
                </div>

                {/* Headline */}
                <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-[-2px] text-black mb-6">
                    Ready to bring your ideas to life?
                </h2>

                {/* Subtext */}
                <p className="font-body text-lg text-[#505050] tracking-[-0.2px] max-w-2xl mx-auto mb-10 leading-relaxed">
                    Join thousands of creators, educators, and marketers using Dryink to turn text into stunning video animations in seconds.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto bg-black hover:bg-black/80 text-white font-nav font-medium h-12 px-8 rounded-full text-base transition-all"
                    >
                        Get Started for Free
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-neutral-300 bg-transparent text-black font-nav font-medium hover:bg-neutral-100 hover:text-black h-12 px-8 rounded-full text-base group"
                    >
                        Request Demo
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                {/* Social Proof / Trust signal text */}
                <p className="mt-8 font-body text-sm text-neutral-500">
                    No credit card required · 14-day free trial · Cancel anytime
                </p>
            </motion.div>
        </div>
      </div>
    </section>
  );
}
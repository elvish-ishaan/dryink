"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Search, Database, Settings, Users } from "lucide-react";
import Image from "next/image";

const sections = [
  {
    title: "Collaborative Console",
    text: `Get AI powered recommendations to optimize query performance.`,
    subText: "Built to serve your whole team working together.",
    image:
      "https://www.shutterstock.com/image-photo/digital-brain-circuit-ai-cocept-600nw-2498421665.jpg",
    icon: <Search size={18} />,
  },
  {
    title: "Instant Postgres Setup",
    text: `Spin up a production-ready Postgres DB in seconds.`,
    subText: "Blazing fast from the first request.",
    image:
      "https://img.freepik.com/free-vector/ai-technology-microchip-background-vector-digital-transformation-concept_53876-112222.jpg",
    icon: <Database size={18} />,
  },
  {
    title: "Edge Caching",
    text: `Serve data from the edge with zero effort.`,
    subText: "One line of config. Real speed.",
    image:
      "https://ichef.bbci.co.uk/ace/standard/1024/cpsprodpb/14202/production/_108243428_gettyimages-871148930.jpg",
    icon: <Settings size={18} />,
  },
  {
    title: "Built for Teams",
    text: `Organize work, manage access, and collaborate in real time.`,
    subText: "Empower your engineers and analysts.",
    image:
      "https://community.nasscom.in/sites/default/files/styles/960_x_600/public/media/images/artificial-intelligence-7768524_1920-edited.jpg?itok=ztrPTpOP",
    icon: <Users size={18} />,
  },
];

export default function Featured() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="bg-white w-full text-neutral-900 dark:bg-neutral-900 dark:text-white py-10 px-6 md:px-32">
      <div className="flex flex-col justify-center items-center text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-[#4a3294]">
          We built something truly unique
        </h2>
        <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
          With our modern serverless architecture, and tight integration with
          Prisma ORM, we created a Postgres variant that feels like magic and
          scales as fast as your ideas.
        </p>
      </div>

      <div ref={containerRef} className="relative min-h-screen py-20">
        {/* Vertical Line */}
        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2 w-[1px] bg-[#4a3294] rounded-full z-0"
          style={{ height: lineHeight }}
        />

        {/* Sections */}
        <div className="space-y-32 relative z-10">
          {sections.map((section, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center max-w-6xl mx-auto"
              >
                {isEven ? (
                  <>
                    {/* Text */}
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-left"
                    >
                      <h3 className="text-3xl font-semibold text-[#4a3294] mb-4">
                        {section.title}
                      </h3>
                      <p className="text-base text-gray-300 mb-2">
                        {section.text}
                      </p>
                      <p className="text-base text-gray-400">
                        {section.subText}
                      </p>
                    </motion.div>

                    {/* Icon */}
                    <div className="flex justify-center items-center h-full">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="bg-[#4a3294] text-white p-3 rounded-full shadow-lg"
                      >
                        {section.icon}
                      </motion.div>
                    </div>

                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      className="flex justify-center"
                    >
                      <img
                        src={section.image}
                        alt={section.title}
                        className="w-[250px] h-[250px] object-cover rounded-xl shadow-xl"
                      />
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      className="flex justify-center"
                    >
                      <img
                        src={section.image}
                        alt={section.title}
                        className="w-[250px] h-[250px] object-cover rounded-xl shadow-xl"
                      />
                    </motion.div>

                    {/* Icon */}
                    <div className="flex justify-center items-center h-full">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="bg-[#4a3294] text-white p-3 rounded-full shadow-lg"
                      >
                        {section.icon}
                      </motion.div>
                    </div>

                    {/* Text */}
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-left"
                    >
                      <h3 className="text-3xl font-semibold text-[#4a3294] mb-4">
                        {section.title}
                      </h3>
                      <p className="text-base text-gray-300 mb-2">
                        {section.text}
                      </p>
                      <p className="text-base text-gray-400">
                        {section.subText}
                      </p>
                    </motion.div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

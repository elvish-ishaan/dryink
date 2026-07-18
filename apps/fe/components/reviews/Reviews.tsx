"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";

// Dummy data for testimonials
const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Content Creator",
    avatar: "/avatars/alex.png", // Replace with actual path
    rating: 5,
    content:
      "Dryink has completely revolutionized my workflow. The AI video generation is incredibly fast and the quality is top-notch. It's like having a personal animator!",
  },
  {
    id: 2,
    name: "Sarah Williams",
    role: "Marketing Manager",
    avatar: "/avatars/sarah.png", // Replace with actual path
    rating: 5,
    content:
      "I was skeptical at first, but the results speak for themselves. Our engagement has doubled since we started using Dryink for our social media content. Highly recommend!",
  },
  {
    id: 3,
    name: "Michael Brown",
    role: "Educator",
    avatar: "/avatars/michael.png", // Replace with actual path
    rating: 4,
    content:
      "Great tool for creating educational videos. The ability to refine the output with follow-up prompts is a game-changer. It makes complex topics easy to explain.",
  },
  // Add more testimonials as needed
];

export default function Testimonials() {
  return (
    <section className="dark:bg-neutral-900 py-20 px-6 md:px-32 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#4a3294] mb-4">
            What Our Users Are Saying
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            See how Dryink is helping creators, marketers, and educators bring their ideas to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="bg-[#1E1E1E] border-none text-white"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                  <AvatarImage
                    src={testimonial.avatar}
                    alt={testimonial.name}
                  />
                  <AvatarFallback className="bg-primary-purple text-white">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle className="text-lg font-semibold">
                    {testimonial.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {testimonial.role}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed">
                  &quot;{testimonial.content}&quot;
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
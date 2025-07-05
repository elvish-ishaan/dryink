"use client";
import InputCard from "@/components/dashboard/InputCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PromptItem } from "@/types/types";
import { useState } from "react";
import ToolTiper from "./ToolTiper";

interface PromptCardProps {
  onSubmit: (
    prompt: string,
    params: {
      width: number;
      height: number;
      fps: number;
      frameCount: number;
    }
  ) => Promise<{
    videoUrl: string;
    genRes: string;
    prompt: string;
  } | undefined>;
}

export default function PromptCard({ onSubmit }: PromptCardProps) {
  const [promptHistory, setPromptHistory] = useState<PromptItem[]>([]);
    
  const handlePromptSubmit = async (
    prompt: string,
    params: {
      width: number;
      height: number;
      fps: number;
      frameCount: number;
    }
  ) => {
    const timestamp = Date.now();
    const newPrompt: PromptItem = {
      prompt,
      status: "pending",
      timestamp,
    };
    setPromptHistory((prev) => [...prev, newPrompt]);

    try {
      const result = await onSubmit(prompt, params);
      
      // Update the prompt status to completed
      setPromptHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp
            ? {
                ...item,
                status: "completed",
                videoUrl: result?.videoUrl || '',
                genRes: result?.genRes || '',
              }
            : item
        )
      );
      
      return result;
    } catch (err) {
      console.error(err);
      setPromptHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp
            ? { ...item, status: "canceled" }
            : item
        )
      );
      throw err; // Re-throw to maintain error handling in parent
    }
  };

  return (
    <Card className="flex flex-col !pb-0 h-full bg-neutral-800 rounded-none overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>Prompt History
          {/* Prompt Guidance */}
          <ToolTiper  trigger="💡">
            <div className="text-xs">
              Add a clear and descriptive prompt to get the best results.
            </div>
          </ToolTiper>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col h-full px-2 pb-2 overflow-hidden">
        {/* Scrollable prompt history */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-neutral-600 p-2 rounded-lg">
          <div className="space-y-2 pr-1">
            {promptHistory.length === 0 ? (
              <p className="text-sm text-neutral-300">No prompts yet.</p>
            ) : (
              promptHistory.map((item) => (
                <div
                  key={item.timestamp}
                  className={cn(
                    "p-2 border text-sm rounded-lg",
                    item.status === "completed" && "border-neutral-500",
                    item.status === "pending" && "border-neutral-500 font-bold italic",
                    item.status === "canceled" && "border-neutral-500"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground flex-grow break-words pr-4">
                      {item.prompt}
                    </p>
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "default"
                          : item.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {item.status === "pending" ? "Generating" : item.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sticky InputCard */}
        <div className="shrink-0 mt-2">
          {/* @ts-expect-error fix */}
          <InputCard onSubmit={handlePromptSubmit} />
        </div>
      </CardContent>
    </Card>
  );
}
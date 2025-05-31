"use client";
import InputCard from "@/components/dashboard/InputCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PromptItem } from "@/types/types";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { BACKEND_BASE_URL } from "@/lib/constants";

interface PromptCardProps {
  onSubmit: (prompt: string, params: {
    width: number;
    height: number;
    fps: number;
    frameCount: number;
  }, isFollowUp?: boolean) => Promise<{
    videoUrl: string;
    genRes: string;
    prompt: string;
  }>;
}

export default function PromptCard({ onSubmit }: PromptCardProps) {
    const [promptHistory, setPromptHistory] = useState<PromptItem[]>([]);
    const { data: session } = useSession();
    const [chatSessionId, setChatSessionId] = useState<string | null>(null);

    const handlePromptSubmit = async (prompt: string, params: {
        width: number;
        height: number;
        fps: number;
        frameCount: number;
    }, isFollowUp: boolean = false) => {
        const timestamp = Date.now();
        const newPrompt: PromptItem = {
            prompt,
            status: 'pending',
            timestamp,
        };
        setPromptHistory((prev) => [...prev, newPrompt]);

        try {
            const result = await onSubmit(prompt, params, isFollowUp);
            
            // Update prompt history with the result
            setPromptHistory((prev) =>
                prev.map((item) =>
                    item.timestamp === timestamp
                        ? { ...item, status: 'completed', videoUrl: result.videoUrl, genRes: result.genRes }
                        : item
                )
            );

            return result;
        } catch (err) {
            console.error(err);
            setPromptHistory((prev) =>
                prev.map((item) =>
                    item.timestamp === timestamp ? { ...item, status: 'canceled' } : item
                )
            );
            throw err;
        }
    };

    return (
        <Card className="flex flex-col h-full bg-neutral-800">
            <CardHeader className="py-2">
                <CardTitle>Prompt History</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 p-2">
                <ScrollArea className="flex-1 border p-2 min-h-0">
                    {promptHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No prompts yet.</p>
                    ) : (
                        promptHistory.map((item) => (
                            <div
                                key={item.timestamp}
                                className={cn(
                                    'p-2 border text-sm mb-1',
                                    item.status === 'completed' && 'border-green-500',
                                    item.status === 'pending' && 'border-yellow-500 font-bold italic',
                                    item.status === 'canceled' && 'border-red-500'
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="text-muted-foreground max-w-[80%] truncate">{item.prompt}</p>
                                    <Badge
                                        variant={
                                            item.status === 'completed'
                                                ? 'default'
                                                : item.status === 'pending'
                                                ? 'outline'
                                                : 'destructive'
                                        }
                                    >
                                        {item.status === 'pending' ? 'Generating' : item.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </ScrollArea>

                <InputCard onSubmit={handlePromptSubmit} />
            </CardContent>
        </Card>
    );
}

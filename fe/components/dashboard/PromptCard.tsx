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

        const endpoint = isFollowUp
            ? `${BACKEND_BASE_URL}/prompt/followUpPrompt`
            : `${BACKEND_BASE_URL}/prompt`;

        const body = isFollowUp
            ? {
                chatSessionId,
                followUprompt: prompt,
                previousGenRes: promptHistory[promptHistory.length - 1]?.genRes,
                ...params
            }
            : {
                prompt,
                ...params
            };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${session?.user?.accessToken}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            console.log(data,'getting responce.........')

            if (data.success) {
                if (!isFollowUp) {
                    setChatSessionId(data.data?.chatSessionId);
                }
                const videoUrl = data.data?.signedUrl;
                const genRes = data.data?.genRes;
                const returnedPrompt = data.data?.prompt || prompt;

                setPromptHistory((prev) =>
                    prev.map((item) =>
                        item.timestamp === timestamp
                            ? { ...item, status: 'completed', videoUrl, genRes }
                            : item
                    )
                );

                return {
                    videoUrl,
                    genRes,
                    prompt: returnedPrompt
                };
            } else {
                setPromptHistory((prev) =>
                    prev.map((item) =>
                        item.timestamp === timestamp ? { ...item, status: 'canceled' } : item
                    )
                );
                throw new Error('Generation failed');
            }
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
        <Card className="flex flex-col overflow-hidden h-full bg-neutral-800">
            <CardHeader className="py-3">
                <CardTitle>Prompt History</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 gap-3 p-3 overflow-hidden">
                {/* Chat History */}
                <ScrollArea className="flex-1 rounded-md border p-2 min-h-0 overflow-auto">
                    {promptHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">No prompts yet.</p>
                    ) : (
                        promptHistory.map((item) => (
                            <div
                                key={item.timestamp}
                                className={cn(
                                    'p-2 rounded-md shadow-sm border text-sm mb-2',
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

                {/* Prompt Input */}
                <InputCard onSubmit={handlePromptSubmit} />
            </CardContent>
        </Card>
    );
}

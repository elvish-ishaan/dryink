"use client";
import InputCard from "@/components/dashboard/InputCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PromptItem } from "@/types/types";
import { useState } from "react";


export default function PromptCard() {
    const [promptHistory, setPromptHistory] = useState<PromptItem[]>([]); 
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
            <InputCard/>
          </CardContent>
        </Card>
  )
}

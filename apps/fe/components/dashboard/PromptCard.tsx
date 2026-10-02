"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, CornerUpLeft, Loader2 } from "lucide-react";
import InputCard from "./InputCard";
import type { ConversationMessage } from '@/types/types';

interface PromptCardProps {
  messages: ConversationMessage[];
  onSubmit: (prompt: string, params: { model: string }) => Promise<void>;
  isGenerating: boolean;
}

export default function PromptCard({ messages, onSubmit, isGenerating }: PromptCardProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyPrompt, setReplyPrompt] = useState<string | undefined>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="flex flex-col !pb-0 h-full bg-white dark:bg-neutral-950 rounded-none border-0 shadow-none overflow-hidden">
      <CardContent className="flex flex-col h-full px-2 pb-2 overflow-hidden">
        {/* Scrollable conversation area */}
        <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl p-3 mt-2">
          {messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 group/msg ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300" />
                    </div>
                  )}

                  <div className={`flex items-end gap-1 max-w-[78%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`px-3 py-2 rounded-2xl font-body text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-black text-white dark:bg-white dark:text-black rounded-tr-sm"
                          : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-sm"
                      }`}
                    >
                      {msg.status === "pending" ? (
                        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                          <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                          <span className="italic text-xs">Thinking...</span>
                        </div>
                      ) : msg.status === "failed" ? (
                        <span className="text-red-500 dark:text-red-400 text-xs">
                          Failed to generate a response.
                        </span>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.status === "sent" && msg.content && (
                      <button
                        onClick={() => setReplyPrompt(msg.content)}
                        className="flex-shrink-0 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Reply with this message"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Generating video indicator — shown after assistant responds but video still rendering */}
              {isGenerating && messages[messages.length - 1]?.status !== "pending" && (
                <div className="flex items-center gap-2 justify-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300" />
                  </div>
                  <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-body text-xs text-neutral-400 dark:text-neutral-500 italic flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                    Rendering your animation...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Sticky input */}
        <div className="shrink-0 mt-2">
          <InputCard
            onSubmit={async (p, params) => { setReplyPrompt(undefined); await onSubmit(p, params); }}
            disabled={isGenerating}
            prefillPrompt={replyPrompt}
          />
        </div>
      </CardContent>
    </Card>
  );
}

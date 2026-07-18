"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, CornerUpLeft, Loader2 } from "lucide-react";
import InputCard from "./InputCard";
import type { ConversationMessage } from '@/types/types';
import ToolTiper from "./ToolTiper";

interface PromptCardProps {
  messages: ConversationMessage[];
  onSubmit: (prompt: string, params: { fps: number; model: string }) => Promise<void>;
  isGenerating: boolean;
}

export default function PromptCard({ messages, onSubmit, isGenerating }: PromptCardProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyPrompt, setReplyPrompt] = useState<string | undefined>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="flex flex-col !pb-0 h-full bg-neutral-800 rounded-none overflow-hidden">
      <CardHeader className="shrink-0 py-3">
        <CardTitle className="text-base">
          Conversation
          <ToolTiper trigger="💡">
            <div className="text-xs">
              Describe your animation or follow up to refine it.
            </div>
          </ToolTiper>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col h-full px-2 pb-2 overflow-hidden">
        {/* Scrollable conversation area */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-neutral-600 rounded-lg p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-500">
                Start a conversation to generate your animation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 group/msg ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-neutral-300" />
                    </div>
                  )}

                  <div className={`flex items-end gap-1 max-w-[78%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-neutral-700 text-white rounded-tr-sm"
                          : "bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-tl-sm"
                      }`}
                    >
                      {msg.status === "pending" ? (
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                          <span className="italic text-xs">Thinking...</span>
                        </div>
                      ) : msg.status === "failed" ? (
                        <span className="text-red-400 text-xs">
                          Failed to generate a response.
                        </span>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.status === "sent" && msg.content && (
                      <button
                        onClick={() => setReplyPrompt(msg.content)}
                        className="flex-shrink-0 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300"
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
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-neutral-300" />
                  </div>
                  <div className="px-3 py-2 rounded-lg rounded-tl-sm bg-neutral-900 border border-neutral-700 text-xs text-neutral-400 italic flex items-center gap-2">
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

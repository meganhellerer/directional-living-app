"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Mode = "direction" | "decision" | "checkin";

const MODE_CONFIG = {
  direction: {
    label: "What's My Direction?",
    description: "Figure out what you want and where you're going",
    starter: "I'm here to help you find your direction. What's going on for you right now? Tell me what's brought you here today.",
  },
  decision: {
    label: "Help Me Decide",
    description: "Work through a specific decision using the framework",
    starter: "Let's work through this decision together. What are you trying to decide?",
  },
  checkin: {
    label: "Check In",
    description: "You've taken action — let's see what happened",
    starter: "Good to see you back. What happened since we last talked? What did you do, and what came of it?",
  },
};

export default function ChatInterface() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    const starter = MODE_CONFIG[selectedMode].starter;
    setMessages([{ role: "assistant", content: starter }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.body) throw new Error("No response body");

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + text,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-light text-stone-800 mb-2 tracking-tight">
              Directional Living
            </h1>
            <p className="text-stone-500 text-base">
              What do you need today?
            </p>
          </div>

          <div className="space-y-3">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => selectMode(m)}
                className="w-full text-left p-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-400 hover:shadow-sm transition-all group"
              >
                <div className="font-medium text-stone-800 mb-1 group-hover:text-stone-900">
                  {MODE_CONFIG[m].label}
                </div>
                <div className="text-sm text-stone-500">
                  {MODE_CONFIG[m].description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => { setMode(null); setMessages([]); }}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← Back
        </button>
        <span className="text-sm font-medium text-stone-700">
          {MODE_CONFIG[mode].label}
        </span>
        <div className="w-12" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-stone-800 text-white rounded-br-sm"
                    : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
            rows={1}
            className="flex-1 resize-none bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
            style={{ minHeight: "44px", maxHeight: "160px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-stone-800 text-white rounded-xl p-3 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-stone-400 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

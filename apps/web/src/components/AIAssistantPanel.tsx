"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Send, Sparkles, Loader2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantPanelProps {
  experimentId: string;
}

const QUICK_ACTIONS = [
  {
    label: "解释实验结果",
    prompt: "请帮我解释当前实验的结果，并给出科学分析。",
  },
  {
    label: "生成摘要",
    prompt: "请根据当前实验内容生成一段简洁的摘要，包含主要目的、方法和结果。",
  },
  {
    label: "推荐后续实验",
    prompt: "基于当前实验的结果和状态，请推荐下一步可以开展的实验或改进方向。",
  },
  {
    label: "异常检测",
    prompt:
      "请分析当前实验数据，指出是否存在异常值、数据不一致或需要关注的问题。",
  },
];

export default function AIAssistantPanel({
  experimentId,
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await api.aiChat(experimentId, trimmed);
      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `请求失败：${err?.message || "未知错误"}，请稍后重试。`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
        }}
        title="AI 实验助手"
        aria-label="打开 AI 实验助手"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </button>

      {/* Side panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-gray-200 bg-white shadow-2xl sm:w-[400px]">
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">AI 实验助手</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                  <Bot className="mb-3 h-12 w-12 text-purple-200" />
                  <p className="text-sm font-medium text-gray-600">
                    你好！我是 AI 实验助手
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    可以向我提问关于当前实验的任何问题
                  </p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white
                      ${msg.role === "user" ? "bg-blue-500" : "bg-purple-600"}`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                      ${
                        msg.role === "user"
                          ? "rounded-tr-sm bg-blue-600 text-white"
                          : "rounded-tl-sm bg-gray-100 text-gray-800"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {messages.length === 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <p className="mb-2 text-xs font-medium text-gray-400">
                  快速操作
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-left text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-200 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入问题，Enter 发送，Shift+Enter 换行..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                  style={{ maxHeight: "120px" }}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition-colors"
                  aria-label="发送"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-gray-400">
                由 Claude AI 提供支持 · 仅供科研参考
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

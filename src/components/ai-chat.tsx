"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm your Hong Kong commercial property advisor. Whether you're looking for an office in Central, an F&B unit in Causeway Bay, a warehouse in Kwai Chung, or something more specialised — tell me about your business and what you need. What type of commercial space are you looking for?",
};

export function AiChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setLastQuery(userMessage);

    try {
      const res = await fetch("/api/ai/parse-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      if (res.ok) {
        const parsed = await res.json();

        const hasFilters =
          parsed.filters?.districts?.length ||
          parsed.filters?.propertyTypes?.length ||
          parsed.filters?.minRent ||
          parsed.filters?.maxRent ||
          parsed.filters?.minArea ||
          parsed.filters?.maxArea ||
          parsed.businessContext;

        const parts: string[] = [];

        if (hasFilters) {
          parts.push("I understand what you're looking for. Here's what I picked up:\n");

          if (parsed.filters?.districts?.length) {
            parts.push(`**Districts:** ${parsed.filters.districts.join(", ")}`);
          }
          if (parsed.filters?.propertyTypes?.length) {
            const typeLabels: Record<string, string> = {
              office: "Office",
              retail: "Retail",
              fnb: "F&B",
              warehouse: "Warehouse",
              industrial: "Industrial",
            };
            parts.push(
              `**Property types:** ${parsed.filters.propertyTypes.map((t: string) => typeLabels[t] || t).join(", ")}`
            );
          }
          if (parsed.filters?.minRent || parsed.filters?.maxRent) {
            const min = parsed.filters.minRent
              ? `HK$${parsed.filters.minRent.toLocaleString()}`
              : "any";
            const max = parsed.filters.maxRent
              ? `HK$${parsed.filters.maxRent.toLocaleString()}`
              : "any";
            parts.push(`**Budget:** ${min} – ${max}/mo`);
          }
          if (parsed.filters?.minArea || parsed.filters?.maxArea) {
            const min = parsed.filters.minArea ? `${parsed.filters.minArea} sq ft` : "any";
            const max = parsed.filters.maxArea ? `${parsed.filters.maxArea} sq ft` : "any";
            parts.push(`**Area:** ${min} – ${max}`);
          }
          if (parsed.businessContext) {
            parts.push(`**Business type:** ${parsed.businessContext}`);
          }
          if (parsed.softPreferences?.exhaustFeasibility) {
            parts.push("**Note:** I'll check exhaust/ventilation feasibility for F&B use.");
          }

          parts.push(
            "\nClick **Search Properties** below to see matching listings, or tell me more to refine your requirements."
          );

          // Build search URL from parsed results
          const searchParams = new URLSearchParams();
          searchParams.set("view", "results");
          if (parsed.filters?.districts?.length)
            searchParams.set("districts", parsed.filters.districts.join(","));
          if (parsed.filters?.propertyTypes?.length)
            searchParams.set("types", parsed.filters.propertyTypes.join(","));
          if (parsed.filters?.minRent)
            searchParams.set("minRent", String(parsed.filters.minRent));
          if (parsed.filters?.maxRent)
            searchParams.set("maxRent", String(parsed.filters.maxRent));
          if (parsed.filters?.minArea)
            searchParams.set("minArea", String(parsed.filters.minArea));
          if (parsed.filters?.maxArea)
            searchParams.set("maxArea", String(parsed.filters.maxArea));
          setLastQuery(searchParams.toString());
        } else {
          parts.push(
            "I'd love to help! Could you be more specific? Try including details like:\n"
          );
          parts.push("• **Location** — Central, Wan Chai, Kwun Tong, etc.");
          parts.push("• **Type** — office, retail, F&B, warehouse");
          parts.push("• **Size** — e.g. around 500 sq ft");
          parts.push("• **Budget** — e.g. under HK$30,000/mo");
          parts.push(
            "\nFor example: \"I need a 500 sq ft office in Central for under 30,000 a month.\""
          );
        }

        setMessages((prev) => [...prev, { role: "assistant", content: parts.join("\n") }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I can help you search! Try describing what you need — for example: \"a ground-floor retail unit in Mong Kok, around 500 sq ft, suitable for a bubble tea shop.\"\n\nYou can also use the filters on the left to narrow down your search, then click **Search Properties**.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please use the filters on the left to search, or try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchClick() {
    if (lastQuery && lastQuery.includes("view=results")) {
      router.push(`/search?${lastQuery}`);
    } else if (lastQuery) {
      router.push(`/search?q=${encodeURIComponent(lastQuery)}&view=results`);
    } else {
      router.push("/search?view=results");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500">
          <Bot className="h-5 w-5 text-black" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Property Advisor</h3>
          <p className="text-xs text-gray-400">Hong Kong Commercial Property Expert</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            {msg.role === "assistant" ? (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 mt-0.5">
                <Bot className="h-4 w-4 text-black" />
              </div>
            ) : (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-600 mt-0.5">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
              {msg.content.split(/(\*\*.*?\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j} className="text-amber-400 font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 mt-0.5">
              <Bot className="h-4 w-4 text-black" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your requirements...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe what you're looking for..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-black transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSearchClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          <Search className="h-4 w-4" />
          Search Properties
        </button>
      </div>
    </div>
  );
}

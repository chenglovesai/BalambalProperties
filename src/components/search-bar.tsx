"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  initialQuery?: string;
  large?: boolean;
  placeholder?: string;
}

export function SearchBar({
  initialQuery = "",
  large = false,
  placeholder = "Search by location, property type, or describe what you need...",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isAiParsing, setIsAiParsing] = useState(false);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      setIsAiParsing(true);

      try {
        const res = await fetch("/api/ai/parse-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (res.ok) {
          const parsed = await res.json();
          const params = new URLSearchParams();
          params.set("q", query);

          if (parsed.filters?.districts?.length) {
            params.set("districts", parsed.filters.districts.join(","));
          }
          if (parsed.filters?.propertyTypes?.length) {
            params.set("types", parsed.filters.propertyTypes.join(","));
          }
          if (parsed.filters?.minRent) params.set("minRent", String(parsed.filters.minRent));
          if (parsed.filters?.maxRent) params.set("maxRent", String(parsed.filters.maxRent));
          if (parsed.filters?.minArea) params.set("minArea", String(parsed.filters.minArea));
          if (parsed.filters?.maxArea) params.set("maxArea", String(parsed.filters.maxArea));

          router.push(`/search?${params.toString()}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      } catch {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      } finally {
        setIsAiParsing(false);
      }
    },
    [query, router]
  );

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${
            large ? "h-5 w-5" : "h-4 w-4"
          }`}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`${
            large ? "h-14 pl-11 pr-32 text-base" : "h-10 pl-10 pr-24 text-sm"
          }`}
        />
        <Button
          type="submit"
          disabled={isAiParsing}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 ${
            large ? "h-11" : "h-7"
          }`}
          size={large ? "default" : "sm"}
        >
          {isAiParsing ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Parsing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Search
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

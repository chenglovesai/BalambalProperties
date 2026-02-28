"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShortlistButtonProps {
  propertyId: string;
}

export function ShortlistButton({ propertyId }: ShortlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/shortlist?propertyId=${propertyId}`)
      .then((res) => res.json())
      .then((data) => setIsSaved(data.isSaved))
      .catch(() => {});
  }, [session, propertyId]);

  async function handleToggle() {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const method = isSaved ? "DELETE" : "POST";
      const res = await fetch("/api/shortlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });

      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      className="w-full"
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      {isSaved ? "Saved to Shortlist" : "Save to Shortlist"}
    </Button>
  );
}

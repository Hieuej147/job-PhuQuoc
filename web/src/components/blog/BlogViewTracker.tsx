"use client";

import { useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api-client";

interface BlogViewTrackerProps {
  slug: string;
  delayMs?: number;
}

export function BlogViewTracker({ slug, delayMs = 15000 }: BlogViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    trackedRef.current = false;
    const timer = window.setTimeout(async () => {
      if (trackedRef.current) return;
      trackedRef.current = true;

      try {
        await fetch(apiUrl(`/api/v1/blogs/slug/${slug}/view`), { method: "POST" });
      } catch (error) {
        console.error("Không thể ghi nhận lượt xem blog:", error);
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, slug]);

  return null;
}

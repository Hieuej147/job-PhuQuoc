export function getRealtimeUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_REALTIME_URL || process.env.NEXT_PUBLIC_API_URL || "";
  }
  return process.env.NEXT_PUBLIC_REALTIME_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";
}

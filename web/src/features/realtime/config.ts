export function getRealtimeUrl() {
  return process.env.NEXT_PUBLIC_REALTIME_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost";
}

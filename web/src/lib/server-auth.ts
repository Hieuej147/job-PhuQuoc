"use server";
import { headers } from "next/headers";
import type { AuthUser } from "@/lib/auth";

const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:3006").replace("localhost", "127.0.0.1");

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  // Use raw cookie header to avoid Next.js filtering out __Secure- cookies on HTTP connections
  const rawCookieHeader = headersList.get("cookie") || "";
  const cookieHeader = rawCookieHeader;

  if (!cookieHeader) {
    return null;
  }

  try {
    const fetchHeaders: Record<string, string> = {
      cookie: cookieHeader,
    };

    // Forward origin headers for Better Auth verification
    const forwardedHost = headersList.get("x-forwarded-host");
    const host = headersList.get("host");
    const origin = headersList.get("origin");
    const forwardedProto = headersList.get("x-forwarded-proto");
    
    if (forwardedHost) fetchHeaders["x-forwarded-host"] = forwardedHost;
    if (host) fetchHeaders["host"] = host;
    if (origin) fetchHeaders["origin"] = origin;
    if (forwardedProto) fetchHeaders["x-forwarded-proto"] = forwardedProto;
    // Fallback to https if running via ngrok and header is somehow missing
    else if (host?.includes("ngrok")) fetchHeaders["x-forwarded-proto"] = "https";

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: fetchHeaders,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload.data?.user || payload.user || payload;
  } catch (error) {
    console.error("[getServerAuthUser] Network/Fetch Error:", error);
    return null;
  }
}

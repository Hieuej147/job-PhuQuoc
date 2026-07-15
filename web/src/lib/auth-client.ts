import { createAuthClient } from "better-auth/client";
import { apiUrl } from "@/lib/api-client";

const appOrigin =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
    : window.location.origin;

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ? apiUrl("/api/auth") : `${appOrigin}/api/auth`,
});

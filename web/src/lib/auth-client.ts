import { createAuthClient } from "better-auth/client";

const appOrigin =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
    : window.location.origin;

export const authClient = createAuthClient({
  baseURL: `${appOrigin}/api/auth`,
});

"use server";
import { cookies } from "next/headers";
import type { AuthUser } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3006";

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    return payload?.data?.user || payload?.user || null;
  } catch (error) {
    console.error("getServerAuthUser fetch failed:", error);
    return null;
  }
}

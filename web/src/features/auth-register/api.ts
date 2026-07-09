import { authFetch } from "@/lib/auth";

export type RegisterEmailResult = {
  status: "VERIFY_EMAIL";
  email: string;
  role: "CANDIDATE" | "EMPLOYER";
};

export async function registerEmail(payload: {
  name: string;
  email: string;
  password: string;
  role: "CANDIDATE" | "EMPLOYER";
  phone?: string;
}): Promise<RegisterEmailResult> {
  const response = await authFetch("/api/v1/auth/register-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(error.message || "Registration failed");
  }

  return response.json();
}

export async function completeEmailRegistration(payload: {
  email: string;
  otp: string;
  password: string;
}) {
  const response = await authFetch("/api/v1/auth/complete-email-registration", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Verification failed" }));
    throw new Error(error.message || "Verification failed");
  }

  return response.json();
}

const passwordKey = (email: string) => `pqjobs.pending-register-password:${email.toLowerCase()}`;

export function savePendingRegisterPassword(email: string, password: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(passwordKey(email), password);
}

export function getPendingRegisterPassword(email: string) {
  if (typeof window === "undefined") return null;
  const key = passwordKey(email);
  return window.sessionStorage.getItem(key);
}

export function clearPendingRegisterPassword(email: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(passwordKey(email));
}

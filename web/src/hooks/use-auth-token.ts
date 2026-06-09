"use client";

import { useEffect, useState } from "react";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/token", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => setToken(data?.token || null))
      .catch(() => setToken(null));
  }, []);

  return token;
}

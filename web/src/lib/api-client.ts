export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }

  return (body?.data ?? body) as T;
}

export async function apiPatch<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: "PATCH", credentials: "include" });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }

  return (body?.data ?? body) as T;
}

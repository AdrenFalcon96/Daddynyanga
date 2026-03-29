const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export async function apiRequest(method: string, path: string, body?: unknown) {
  const token = localStorage.getItem("token");
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || "Request failed");
  }
  return res.json();
}

export async function queryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  return apiRequest("GET", queryKey[0] as string);
}

export { API_BASE };

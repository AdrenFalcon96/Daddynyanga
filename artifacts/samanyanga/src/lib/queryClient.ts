const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export async function apiRequest(method: string, path: string, body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export async function queryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  return apiRequest("GET", queryKey[0] as string);
}

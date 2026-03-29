const QUEUE_KEY = "samanyanga-offline-queue";

export interface QueuedSubmission {
  id: string;
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  label: string;
  queuedAt: number;
}

function getQueue(): QueuedSubmission[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
}

function saveQueue(q: QueuedSubmission[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function getPendingCount(): number {
  return getQueue().length;
}

export function getPendingItems(): QueuedSubmission[] {
  return getQueue();
}

export function addToQueue(item: Omit<QueuedSubmission, "id" | "queuedAt">): void {
  const q = getQueue();
  q.push({ ...item, id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`, queuedAt: Date.now() });
  saveQueue(q);
}

export async function processQueue(apiBase: string): Promise<{ sent: number; failed: number; labels: string[] }> {
  const q = getQueue();
  if (q.length === 0) return { sent: 0, failed: 0, labels: [] };

  const remaining: QueuedSubmission[] = [];
  const labels: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const item of q) {
    try {
      const url = item.endpoint.startsWith("http") ? item.endpoint : `${apiBase}${item.endpoint}`;
      const res = await fetch(url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        sent++;
        labels.push(item.label);
      } else {
        remaining.push(item);
        failed++;
      }
    } catch {
      remaining.push(item);
      failed++;
    }
  }

  saveQueue(remaining);
  return { sent, failed, labels };
}

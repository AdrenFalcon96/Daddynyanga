const CACHE_NAME = "samanyanga-materials-v1";
const INDEX_KEY = "samanyanga-offline-index";

export interface SavedMeta {
  id: string;
  title: string;
  grade: string;
  subject?: string;
  file_type: string;
  file_name?: string;
  savedAt: number;
  size?: number;
}

function getIndex(): Record<string, SavedMeta> {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY) || "{}"); }
  catch { return {}; }
}
function setIndex(idx: Record<string, SavedMeta>) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

export function getSavedMaterials(): SavedMeta[] {
  return Object.values(getIndex()).sort((a, b) => b.savedAt - a.savedAt);
}
export function isSavedSync(id: string): boolean {
  return !!getIndex()[id];
}

export async function saveMaterial(
  meta: Omit<SavedMeta, "savedAt">,
  url: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (!("caches" in window)) throw new Error("Cache API not supported");
  onProgress?.(5);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const clone = res.clone();
  const blob = await clone.blob();
  onProgress?.(70);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(url, res);
  onProgress?.(90);
  const idx = getIndex();
  idx[meta.id] = { ...meta, savedAt: Date.now(), size: blob.size };
  setIndex(idx);
  onProgress?.(100);
}

export async function removeMaterial(id: string, url: string): Promise<void> {
  if ("caches" in window) {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
  }
  const idx = getIndex();
  delete idx[id];
  setIndex(idx);
}

export async function getCachedUrl(url: string): Promise<string | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(url);
    if (!match) return null;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch { return null; }
}

import { useState, useEffect, useCallback } from "react";
import { processQueue, getPendingCount } from "@/lib/offlineQueue";
import { API_BASE } from "@/lib/queryClient";

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return isOffline;
}

export function usePwaReady() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("pwa-banner-dismissed") === "1"
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setReady(true)).catch(() => {});
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
  };

  return { ready, dismissed, dismiss };
}

export interface QueueResult {
  sent: number;
  labels: string[];
}

export function useOfflineQueue() {
  const isOffline = useOffline();
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());
  const [lastResult, setLastResult] = useState<QueueResult | null>(null);

  // Refresh pending count whenever offline state changes
  useEffect(() => {
    setPendingCount(getPendingCount());
  }, [isOffline]);

  // When coming back online, flush the queue automatically
  useEffect(() => {
    if (!isOffline && getPendingCount() > 0) {
      processQueue(API_BASE).then(result => {
        setPendingCount(getPendingCount());
        if (result.sent > 0) setLastResult({ sent: result.sent, labels: result.labels });
      }).catch(() => {});
    }
  }, [isOffline]);

  const clearResult = useCallback(() => setLastResult(null), []);

  const refreshCount = useCallback(() => setPendingCount(getPendingCount()), []);

  return { pendingCount, lastResult, clearResult, refreshCount };
}

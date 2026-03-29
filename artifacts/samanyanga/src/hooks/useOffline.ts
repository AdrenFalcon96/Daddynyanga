import { useState, useEffect } from "react";

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

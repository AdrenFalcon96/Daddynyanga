import { useOffline, useOfflineQueue } from "@/hooks/useOffline";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const isOffline = useOffline();
  const { lastResult, clearResult } = useOfflineQueue();
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [backOnline, setBackOnline] = useState(false);
  const [queueMsg, setQueueMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      setWasOffline(true);
      setBackOnline(false);
      setQueueMsg(null);
      return undefined;
    } else if (wasOffline) {
      setBackOnline(true);
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOffline, wasOffline]);

  // Show queue delivery notification separately
  useEffect(() => {
    if (!lastResult || lastResult.sent === 0) return;
    const summary = lastResult.sent === 1
      ? `"${lastResult.labels[0]}" was delivered`
      : `${lastResult.sent} queued submissions delivered`;
    setQueueMsg(summary);
    clearResult();
    const t = setTimeout(() => setQueueMsg(null), 5000);
    return () => clearTimeout(t);
  }, [lastResult, clearResult]);

  if (!visible && !queueMsg) return null;

  if (queueMsg) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "10px 16px",
        background: "#4f46e5",
        color: "#fff", fontSize: 13, fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        <span style={{ fontSize: 16 }}>📤</span>
        <span>{queueMsg}</span>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "10px 16px",
      background: backOnline ? "#16a34a" : "#dc2626",
      color: "#fff", fontSize: 13, fontWeight: 600,
      fontFamily: "system-ui, sans-serif",
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      transition: "background 0.3s ease",
    }}>
      <span style={{ fontSize: 16 }}>{backOnline ? "✅" : "📵"}</span>
      <span>
        {backOnline
          ? "Back online"
          : "You're offline — cached content available"}
      </span>
    </div>
  );
}

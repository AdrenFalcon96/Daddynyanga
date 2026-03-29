import { useOffline } from "@/hooks/useOffline";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const isOffline = useOffline();
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [backOnline, setBackOnline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      setWasOffline(true);
      setBackOnline(false);
    } else if (wasOffline) {
      setBackOnline(true);
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); setBackOnline(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOffline, wasOffline]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "10px 16px",
      background: backOnline ? "#16a34a" : "#dc2626",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "system-ui, sans-serif",
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      transition: "background 0.3s ease",
    }}>
      <span style={{ fontSize: 16 }}>{backOnline ? "✅" : "📵"}</span>
      <span>
        {backOnline
          ? "Back online — syncing data..."
          : "You're offline — cached content available"}
      </span>
    </div>
  );
}

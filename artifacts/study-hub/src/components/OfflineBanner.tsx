import { useOnline } from "@/hooks/useOnline";

export function OfflineBanner() {
  const isOnline = useOnline();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#f59e0b",
        color: "#1c1917",
        padding: "8px 16px",
        textAlign: "center",
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span>📵</span>
      <span>
        You are offline — cached content is available. New data will sync when
        you reconnect.
      </span>
    </div>
  );
}

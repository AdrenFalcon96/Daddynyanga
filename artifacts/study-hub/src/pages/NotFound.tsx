import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        textAlign: "center",
        padding: 20,
      }}
    >
      <div style={{ fontSize: 64 }}>📚</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Page Not Found</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
        The page you are looking for doesn&apos;t exist.
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "12px 24px",
          background: "#4f46e5",
          border: "none",
          borderRadius: 10,
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 15,
        }}
      >
        Back to Home
      </button>
    </div>
  );
}

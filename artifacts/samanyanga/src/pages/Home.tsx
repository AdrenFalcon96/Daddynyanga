import { useLocation } from "wouter";
import founderPhoto from "/founder.webp";

function getTokenRole(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [, navigate] = useLocation();
  const role = getTokenRole();
  const isAdmin = role === "admin";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 50%, #1e4d2e 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: "24px",
      position: "relative",
    }}>
      <button
        onClick={() => isAdmin ? navigate("/admin") : navigate("/admin-login")}
        title="Admin"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(220,38,38,0.12)",
          border: "1px solid rgba(220,38,38,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#dc2626", display: "block" }} />
      </button>

      <div style={{ textAlign: "center", maxWidth: 600 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🌾</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: "#ffffff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Samanyanga
        </h1>
        <p style={{ fontSize: 18, color: "#86efac", marginBottom: 8, fontWeight: 500 }}>
          Zimbabwe Agricultural Marketplace
        </p>
        <p style={{ fontSize: 14, color: "#bbf7d0", marginBottom: 40, lineHeight: 1.6 }}>
          Connect with farmers, merchants, and buyers across Zimbabwe.
          Access study materials, AI tutoring, and agricultural market listings — all in one place.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 48 }}>
          {[
            { icon: "🌽", title: "AgriMarketplace", desc: "Buy & sell produce" },
            { icon: "📚", title: "Study Companion", desc: "Grade 7, O & A Level" },
            { icon: "🤖", title: "AI Assistants", desc: "Agri & study AI chat" },
            { icon: "📣", title: "Adverts", desc: "Promote your business" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "16px 20px",
              minWidth: 120,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{title}</p>
              <p style={{ color: "#86efac", fontSize: 11, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "14px 36px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(22,163,74,0.4)",
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "14px 36px",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/public-ads")}
            style={{ background: "none", border: "none", color: "#86efac", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            Browse public adverts →
          </button>
          <button
            onClick={() => navigate("/consultation")}
            style={{ background: "none", border: "none", color: "#86efac", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            Request consultation →
          </button>
        </div>

        <div style={{
          marginTop: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}>
          <img
            src={founderPhoto}
            alt="Founder"
            style={{
              width: 200,
              height: 200,
              objectFit: "cover",
              objectPosition: "top center",
              borderRadius: "50%",
              border: "4px solid rgba(134,239,172,0.6)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          />
          <p style={{ color: "#bbf7d0", fontSize: 13, margin: 0, opacity: 0.8 }}>
            Built with vision. Rooted in Zimbabwe.
          </p>
        </div>
      </div>
    </div>
  );
}

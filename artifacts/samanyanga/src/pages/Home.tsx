import { useState } from "react";
import { useLocation } from "wouter";
import heroPhoto from "/graduation-hero.webp";
import { usePwaReady } from "@/hooks/useOffline";

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

const features = [
  {
    icon: "🧺",
    label: "Agricultural Marketplace",
    desc: "Buy & sell fresh produce directly from farmers",
    color: "#16a34a",
    route: "/farmer",
  },
  {
    icon: "📚",
    label: "Study Companion",
    desc: "ZIMSEC Grade 7, O Level & A Level resources",
    color: "#6366f1",
    route: "/student-companion",
  },
  {
    icon: "🤖",
    label: "AI Assistant",
    desc: "Smart agri and study AI tutor, always available",
    color: "#0ea5e9",
    route: "/farmer",
  },
  {
    icon: "📣",
    label: "Advertise",
    desc: "Promote your farm or business to thousands",
    color: "#f59e0b",
    route: "/public-ads",
  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const role = getTokenRole();
  const isAdmin = role === "admin";

  const { ready: pwaReady, dismissed: pwaDismissed, dismiss: dismissPwa } = usePwaReady();
  const [dark, setDark] = useState(false);

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 28px",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    maxWidth: 280,
  };

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: dark ? "#0f172a" : "#111827",
      color: "#fff",
    }}>

      {/* ── HERO SECTION ── */}
      <div style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Background photo */}
        <img
          src={heroPhoto}
          alt="Graduation"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            zIndex: 0,
          }}
        />

        {/* Dark overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.72) 100%)",
          zIndex: 1,
        }} />

        {/* ── HEADER ── */}
        <header style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
        }}>
          {/* Logo */}
          <button
            onClick={() => isAdmin ? navigate("/admin") : navigate("/admin-login")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
            }}
            title={isAdmin ? "Go to Admin" : "Admin Login"}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}>
              🌿
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Samanyanga</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Companion</div>
            </div>
          </button>

          {/* Right nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Register as Farmer
            </button>
            <button
              onClick={() => setDark(d => !d)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Toggle dark mode"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* ── PWA READY BANNER ── */}
        {pwaReady && !pwaDismissed && (
          <div style={{ position: "relative", zIndex: 10, padding: "0 16px 10px" }}>
            <div
              onClick={dismissPwa}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#16a34a",
                borderRadius: 24,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <span>✅</span>
              <span>App ready for offline use — tap to dismiss</span>
            </div>
          </div>
        )}

        {/* ── HERO CONTENT ── */}
        <div style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 40px",
          textAlign: "center",
        }}>

          {/* Welcome badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 20,
          }}>
            <span>🌿</span>
            <span>Welcome to Samanyanga Companion</span>
          </div>

          {/* Hero heading */}
          <h1 style={{ margin: "0 0 4px", fontWeight: 900, lineHeight: 1.15 }}>
            <span style={{ display: "block", fontSize: "clamp(28px, 8vw, 44px)", color: "#ffffff" }}>
              Your All-in-One
            </span>
            <span style={{ display: "block", fontSize: "clamp(28px, 8vw, 44px)", color: "#4ade80" }}>
              Zimbabwe Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.6,
            maxWidth: 320,
            margin: "16px 0 32px",
          }}>
            Connect with local farmers and buy fresh produce — or study smarter with our ZIMSEC companion and AI tutor.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", width: "100%" }}>
            <button
              onClick={() => navigate("/farmer")}
              style={{ ...btnBase, background: "#16a34a", color: "#fff", boxShadow: "0 4px 20px rgba(22,163,74,0.5)" }}
            >
              🧺 Farm Marketplace
            </button>
            <button
              onClick={() => navigate("/student-companion")}
              style={{ ...btnBase, background: "#4f46e5", color: "#fff", boxShadow: "0 4px 20px rgba(79,70,229,0.5)" }}
            >
              🎓 Study Hub
            </button>
          </div>

          {/* Quick links */}
          <div style={{ display: "flex", gap: 20, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => navigate("/login")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Sign in →
            </button>
            <button onClick={() => navigate("/public-ads")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Browse adverts →
            </button>
            <button onClick={() => navigate("/consultation")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Get consultation →
            </button>
          </div>
        </div>
      </div>

      {/* ── FEATURES SECTION ── */}
      <div style={{
        background: dark ? "#0f172a" : "#0f1f14",
        padding: "40px 20px 60px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute",
          left: -60,
          top: -60,
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "2px solid rgba(74,222,128,0.15)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          left: -30,
          top: -30,
          width: 100,
          height: 100,
          borderRadius: "50%",
          border: "2px solid rgba(74,222,128,0.1)",
          pointerEvents: "none",
        }} />

        <p style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          Everything you need
        </p>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, textAlign: "center", margin: "0 0 28px" }}>
          Explore the Platform
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>
          {features.map((f) => (
            <button
              key={f.label}
              onClick={() => navigate(f.route)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "16px 18px",
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: f.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
                boxShadow: `0 4px 16px ${f.color}55`,
              }}>
                {f.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{f.label}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{f.desc}</div>
              </div>
              {/* Chat FAB style indicator */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: f.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
                boxShadow: `0 2px 8px ${f.color}77`,
              }}>
                →
              </div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 40 }}>
          Built with vision. Rooted in Zimbabwe. 🌱
        </p>
      </div>
    </div>
  );
}

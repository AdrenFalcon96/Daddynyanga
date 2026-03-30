import { useState } from "react";
import { useLocation } from "wouter";

const subjectCategories = [
  {
    icon: "📐",
    label: "Mathematics",
    desc: "O-Level & A-Level Maths, Further Maths",
    color: "#4f46e5",
    levels: ["O-Level", "A-Level"],
  },
  {
    icon: "🔬",
    label: "Sciences",
    desc: "Biology, Chemistry, Physics, Combined Science",
    color: "#059669",
    levels: ["O-Level", "A-Level"],
  },
  {
    icon: "📖",
    label: "Languages",
    desc: "English Language, Shona, Ndebele, Literature",
    color: "#d97706",
    levels: ["O-Level", "A-Level"],
  },
  {
    icon: "🌍",
    label: "Humanities",
    desc: "History, Geography, Religious Studies",
    color: "#7c3aed",
    levels: ["O-Level", "A-Level"],
  },
  {
    icon: "💼",
    label: "Commerce",
    desc: "Accounts, Commerce, Business Studies, Economics",
    color: "#0284c7",
    levels: ["O-Level", "A-Level"],
  },
  {
    icon: "🌱",
    label: "Agriculture",
    desc: "Agriculture, Food & Nutrition, Home Economics",
    color: "#16a34a",
    levels: ["O-Level"],
  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [dark] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: dark ? "#0f172a" : "#1e1b4b",
        color: "#fff",
      }}
    >
      {/* ── HERO SECTION ── */}
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)",
            zIndex: 0,
          }}
        />

        {/* Decorative radial glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />

        {/* ── HEADER ── */}
        <header
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  lineHeight: 1.2,
                }}
              >
                Samanyanga
              </div>
              <div
                style={{
                  color: "#a5b4fc",
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.2,
                }}
              >
                Study Hub
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Register
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "8px 14px",
                background: "#4f46e5",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(79,70,229,0.4)",
              }}
            >
              Sign In
            </button>
          </div>
        </header>

        {/* ── HERO CONTENT ── */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px 60px",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(79,70,229,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(79,70,229,0.4)",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#a5b4fc",
              marginBottom: 24,
            }}
          >
            <span>🇿🇼</span>
            <span>Built for Zimbabwean Students</span>
          </div>

          {/* Hero heading */}
          <h1 style={{ margin: "0 0 8px", fontWeight: 900, lineHeight: 1.1 }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(30px, 9vw, 52px)",
                color: "#ffffff",
              }}
            >
              Study Smarter,
            </span>
            <span
              style={{
                display: "block",
                fontSize: "clamp(30px, 9vw, 52px)",
                background: "linear-gradient(90deg, #818cf8, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Pass Confidently
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              maxWidth: 340,
              margin: "20px 0 36px",
            }}
          >
            Your complete ZIMSEC companion — notes, past papers, AI tutor,
            quizzes, and progress tracking. Works offline too.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
              width: "100%",
              maxWidth: 300,
            }}
          >
            <button
              onClick={() => navigate("/register")}
              style={{
                width: "100%",
                padding: "15px 28px",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(79,70,229,0.5)",
              }}
            >
              🎓 Start Studying Free
            </button>

            <button
              onClick={() => navigate("/subjects")}
              style={{
                width: "100%",
                padding: "13px 28px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📚 Browse Subjects
            </button>
          </div>

          {/* Quick links */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 28,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Already registered? Sign in →
            </button>
          </div>
        </div>
      </div>

      {/* ── SUBJECTS PREVIEW SECTION ── */}
      <div
        style={{
          background: "#111827",
          padding: "48px 20px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative */}
        <div
          style={{
            position: "absolute",
            right: -80,
            top: -80,
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "2px solid rgba(79,70,229,0.12)",
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            color: "#818cf8",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          All ZIMSEC Subjects
        </p>
        <h2
          style={{
            color: "#fff",
            fontSize: 24,
            fontWeight: 800,
            textAlign: "center",
            margin: "0 0 32px",
          }}
        >
          What do you want to study?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          {subjectCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate("/subjects")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "16px 18px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: cat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: `0 4px 14px ${cat.color}55`,
                }}
              >
                {cat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 3,
                  }}
                >
                  {cat.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                  {cat.desc}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                  {cat.levels.map((l) => (
                    <span
                      key={l}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background:
                          l === "A-Level"
                            ? "rgba(79,70,229,0.25)"
                            : "rgba(22,163,74,0.25)",
                        color: l === "A-Level" ? "#a5b4fc" : "#86efac",
                        letterSpacing: 0.5,
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                →
              </div>
            </button>
          ))}
        </div>

        {/* Feature highlights */}
        <div
          style={{
            maxWidth: 680,
            margin: "40px auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { icon: "📱", label: "Works Offline", desc: "Study without internet" },
            { icon: "🤖", label: "AI Tutor", desc: "Ask any ZIMSEC question" },
            { icon: "📊", label: "Progress Tracking", desc: "See how you improve" },
            { icon: "⏱️", label: "Exam Mode", desc: "Timed practice tests" },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "16px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div
                style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}
              >
                {f.label}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.2)",
            fontSize: 12,
            marginTop: 48,
          }}
        >
          Powered by Samanyanga · Rooted in Zimbabwe 🇿🇼
        </p>
      </div>
    </div>
  );
}

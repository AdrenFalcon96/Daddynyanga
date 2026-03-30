import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";

interface AdminLoginPageProps {
  onLogin?: (token: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginPageProps) {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "recovery">("login");
  const [recoveryMsg, setRecoveryMsg] = useState("");

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: 16,
    },
    card: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 16,
      padding: "40px 32px",
      width: "100%",
      maxWidth: 400,
      backdropFilter: "blur(12px)",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 28,
    },
    logoIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
    },
    logoText: { color: "#fff", fontWeight: 800, fontSize: 16, lineHeight: 1.2 },
    logoSub: { color: "#a5b4fc", fontWeight: 600, fontSize: 12 },
    title: { color: "#fff", fontWeight: 700, fontSize: 22, marginBottom: 6 },
    subtitle: { color: "#94a3b8", fontSize: 13, marginBottom: 28 },
    label: { display: "block", color: "#a5b4fc", fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: "0.04em" },
    input: {
      width: "100%",
      padding: "11px 14px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      color: "#fff",
      fontSize: 15,
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 16,
    },
    btn: {
      width: "100%",
      padding: "12px",
      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
      border: "none",
      borderRadius: 10,
      color: "#fff",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      marginTop: 6,
    },
    error: {
      background: "rgba(239,68,68,0.15)",
      border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 8,
      padding: "10px 12px",
      color: "#fca5a5",
      fontSize: 13,
      marginBottom: 16,
    },
    success: {
      background: "rgba(16,185,129,0.15)",
      border: "1px solid rgba(16,185,129,0.3)",
      borderRadius: 8,
      padding: "10px 12px",
      color: "#6ee7b7",
      fontSize: 13,
      marginBottom: 16,
    },
    link: {
      color: "#818cf8",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      textDecoration: "underline",
      padding: 0,
    },
    divider: { borderTop: "1px solid rgba(255,255,255,0.08)", margin: "20px 0" },
  };

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/auth/admin-login", { email, password });
      if (onLogin) onLogin(res.data.token);
      navigate("/admin");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRecoveryMsg("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; message: string }>("/auth/admin-recovery", {
        recovery_code: recoveryCode,
      });
      setRecoveryMsg(res.data.message);
      if (onLogin) onLogin(res.data.token);
      setTimeout(() => navigate("/admin"), 1500);
    } catch {
      setError("Invalid recovery code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>🎓</div>
          <div>
            <div style={s.logoText}>Samanyanga</div>
            <div style={s.logoSub}>Study Hub Admin</div>
          </div>
        </div>

        {mode === "login" ? (
          <>
            <div style={s.title}>Admin Sign In</div>
            <div style={s.subtitle}>Access the content management dashboard</div>

            {error && <div style={s.error}>{error}</div>}

            <form onSubmit={handleAdminLogin}>
              <label style={s.label}>EMAIL</label>
              <input
                style={s.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@samanyanga.com"
                required
                autoComplete="username"
              />
              <label style={s.label}>PASSWORD</label>
              <input
                style={s.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
              />
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div style={s.divider} />
            <div style={{ textAlign: "center" }}>
              <button style={s.link} onClick={() => { setMode("recovery"); setError(""); }}>
                Recovery mode
              </button>
              <span style={{ color: "#475569", fontSize: 12, display: "block", marginTop: 4 }}>
                Use your ADMIN_RECOVERY_CODE env var to regain read-only access
              </span>
            </div>
          </>
        ) : (
          <>
            <div style={s.title}>Recovery Mode</div>
            <div style={s.subtitle}>
              Enter the <code style={{ color: "#a5b4fc" }}>ADMIN_RECOVERY_CODE</code> set on the server to get temporary read-only access.
            </div>

            {error && <div style={s.error}>{error}</div>}
            {recoveryMsg && <div style={s.success}>{recoveryMsg}</div>}

            <form onSubmit={handleRecovery}>
              <label style={s.label}>RECOVERY CODE</label>
              <input
                style={s.input}
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="samanyanga-recovery-2025"
                required
                autoComplete="off"
              />
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? "Verifying…" : "Use Recovery Code"}
              </button>
            </form>

            <div style={s.divider} />
            <button style={s.link} onClick={() => { setMode("login"); setError(""); setRecoveryMsg(""); }}>
              ← Back to Admin Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// ── Local email store (obfuscated, never displayed) ───────────────────────────
const AE_KEY = "_sc_ae";

function storeAdminEmail(email: string) {
  try { localStorage.setItem(AE_KEY, btoa(`sc::${email}::2025`)); } catch {}
}

function loadAdminEmail(): string | null {
  try {
    const raw = localStorage.getItem(AE_KEY);
    if (!raw) return null;
    const decoded = atob(raw);
    const parts = decoded.split("::");
    if (parts[0] === "sc" && parts[2] === "2025") return parts[1];
  } catch {}
  return null;
}

type Mode = "checking" | "setup-email" | "setup-password" | "login" | "api-error" | "recovery";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("checking");
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hidden recovery: count icon clicks
  const [iconClicks, setIconClicks] = useState(0);
  const handleIconClick = useCallback(() => {
    setIconClicks(n => {
      const next = n + 1;
      if (next >= 5) { setMode("recovery"); setError(""); setSuccess(""); return 0; }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMode("checking");
    setStoredEmail(loadAdminEmail());

    async function checkStatus() {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await apiRequest("GET", "/api/admin-setup/status");
          if (!cancelled) {
            setMode(res.adminExists ? "login" : "setup-email");
          }
          return;
        } catch {
          if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
        }
      }
      if (!cancelled) setMode("api-error");
    }

    checkStatus();
    return () => { cancelled = true; };
  }, [checkAttempt]);

  const clearForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword("");
    setRecoveryCode(""); setError(""); setSuccess("");
  };

  // ── Step 1 of setup: verify admin email against server constant ──────────────
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await apiRequest("POST", "/api/admin-setup/verify", { email });
      setMode("setup-password");
      setError("");
    } catch (err: any) {
      setError(err.message || "Unrecognised email address.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 of setup: create admin account with bcrypt password ───────────────
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await apiRequest("POST", "/api/admin-setup", { email, password });
      storeAdminEmail(email);
      setStoredEmail(email);
      localStorage.setItem("token", res.token);
      setSuccess("Admin account created! Redirecting...");
      setTimeout(() => navigate("/admin"), 1200);
    } catch (err: any) {
      setError(err.message || "Setup failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Regular login (password-only when email is stored; fallback shows email) ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const body = storedEmail
        ? { password }
        : { email, password };
      const res = await apiRequest("POST", "/api/admin-login", body);
      if (!storedEmail && email) {
        storeAdminEmail(email);
        setStoredEmail(email);
      }
      localStorage.setItem("token", res.token);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Hidden emergency recovery ────────────────────────────────────────────────
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await apiRequest("POST", "/api/admin-emergency", { code: recoveryCode, password });
      storeAdminEmail(res.user.email);
      setStoredEmail(res.user.email);
      localStorage.setItem("token", res.token);
      setSuccess("Password reset. Redirecting...");
      setTimeout(() => navigate("/admin"), 1200);
    } catch (err: any) {
      setError(err.message || "Recovery failed.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid #d1d5db",
    borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", marginTop: 4,
  };
  const btn = (bg: string): React.CSSProperties => ({
    width: "100%", padding: "12px", background: loading || success ? "#9ca3af" : bg,
    color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
    cursor: loading || success ? "not-allowed" : "pointer",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{
          background: "rgba(255,255,255,0.97)", borderRadius: 12,
          padding: 32, boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
        }}>

          {/* ── Checking ── */}
          {mode === "checking" && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>
              <button onClick={handleIconClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 36, marginBottom: 12, display: "block", margin: "0 auto 12px" }}>🔐</button>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>Connecting to server...</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>This may take up to 30 seconds on first load</p>
            </div>
          )}

          {/* ── API Error ── */}
          {mode === "api-error" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <button onClick={handleIconClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 36, marginBottom: 12 }}>⚠️</button>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#991b1b" }}>Cannot Reach Server</h2>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                The API is not responding. If using Render free tier, the server may be waking up. Please wait a moment and try again.
              </p>
              <button onClick={() => setCheckAttempt(n => n + 1)} style={btn("#4f46e5")}>
                Retry Connection
              </button>
            </div>
          )}

          {/* ── Setup Step 1: Verify email ── */}
          {mode === "setup-email" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <button onClick={handleIconClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 44, marginBottom: 8 }}>🔧</button>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>Server Setup</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Verify your identity to create the admin account</p>
              </div>
              <div style={{ marginBottom: 20, padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 13, color: "#1d4ed8" }}>
                Enter the registered administrator email to continue. This setup runs once only.
              </div>
              {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{error}</div>}
              <form onSubmit={handleVerifyEmail}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Administrator Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} autoComplete="username" />
                </div>
                <button type="submit" disabled={loading} style={btn("#059669")}>
                  {loading ? "Verifying..." : "Verify Email →"}
                </button>
              </form>
            </>
          )}

          {/* ── Setup Step 2: Set password ── */}
          {mode === "setup-password" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <button onClick={handleIconClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 44, marginBottom: 8 }}>🔑</button>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>Set Admin Password</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Email verified. Choose a strong password.</p>
              </div>
              {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{error}</div>}
              {success && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#166534" }}>{success}</div>}
              <form onSubmit={handleSetup}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>New Password (min. 8 characters)</label>
                  <div style={{ position: "relative", marginTop: 4 }}>
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, marginTop: 0, paddingRight: 48 }} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Confirm Password</label>
                  <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inp} autoComplete="new-password" />
                </div>
                <button type="submit" disabled={loading || !!success} style={btn("#059669")}>
                  {loading ? "Creating account..." : "Create Admin Account"}
                </button>
              </form>
              <p style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => { setMode("setup-email"); clearForm(); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 12 }}>← Back</button>
              </p>
            </>
          )}

          {/* ── Login ── */}
          {mode === "login" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <button onClick={handleIconClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 44, marginBottom: 8 }}>🛡️</button>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>Admin Portal</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Samanyanga Companion — Restricted Access</p>
              </div>
              {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{error}</div>}
              <form onSubmit={handleLogin}>
                {/* Only show email field if not stored on this device */}
                {!storedEmail && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Admin Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" style={inp} autoComplete="username" />
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
                  <div style={{ position: "relative", marginTop: 4 }}>
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, marginTop: 0, paddingRight: 48 }} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: 0 }}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={btn("#4f46e5")}>
                  {loading ? "Signing in..." : "Sign In as Admin"}
                </button>
              </form>
            </>
          )}

          {/* ── Hidden Recovery (5-click icon unlock) ── */}
          {mode === "recovery" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <button onClick={handleIconClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 44, marginBottom: 8 }}>🔓</button>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>Emergency Recovery</h2>
                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Enter the recovery code to reset admin password</p>
              </div>
              {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{error}</div>}
              {success && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#166534" }}>{success}</div>}
              <form onSubmit={handleRecovery}>
                <div style={{ marginBottom: 14 }}>
                  <input type="text" required value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} placeholder="Recovery code" style={{ ...inp, fontFamily: "monospace", letterSpacing: 2 }} autoComplete="off" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (min. 8 chars)" style={inp} autoComplete="new-password" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={inp} autoComplete="new-password" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280", marginBottom: 16, cursor: "pointer" }}>
                  <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                  Show passwords
                </label>
                <button type="submit" disabled={loading || !!success} style={btn("#dc2626")}>
                  {loading ? "Resetting..." : "Reset Admin Password"}
                </button>
              </form>
              <p style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => { setMode("login"); clearForm(); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 12 }}>← Cancel</button>
              </p>
            </>
          )}

          {/* ── Footer nav (login & api-error only) ── */}
          {(mode === "login" || mode === "api-error") && (
            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "center", gap: 16 }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
                ← Home
              </button>
              <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
                User Login
              </button>
            </div>
          )}
        </div>

        {(mode === "login") && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 16 }}>
            Samanyanga Companion — Admin Portal
          </p>
        )}
      </div>
    </div>
  );
}

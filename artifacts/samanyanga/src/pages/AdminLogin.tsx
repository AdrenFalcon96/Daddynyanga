import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

type Mode = "checking" | "login" | "setup" | "reset";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("checking");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const res = await apiRequest("GET", "/api/admin-setup/status");
        setMode(res.adminExists ? "login" : "setup");
      } catch {
        setMode("login");
      }
    }
    checkAdminStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/login", { email, password });
      const role = res.user?.role;
      if (role !== "admin") {
        setError("This portal is for administrators only.");
        return;
      }
      localStorage.setItem("token", res.token);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin-reset", { email, password });
      localStorage.setItem("token", res.token);
      setSuccess("Admin account reset! Redirecting to dashboard...");
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin-setup", { email, password });
      localStorage.setItem("token", res.token);
      setSuccess("Admin account created! Redirecting to dashboard...");
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err: any) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    marginTop: 4,
  };

  const isSetup = mode === "setup";
  const isReset = mode === "reset";
  const isChecking = mode === "checking";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
        }}>
          {isChecking ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <p style={{ margin: 0, fontSize: 14 }}>Checking admin status...</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 44 }}>{isSetup ? "🔧" : isReset ? "🔑" : "🛡️"}</div>
                <h2 style={{ margin: "10px 0 4px", fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>
                  {isSetup ? "Create Admin Account" : isReset ? "Reset Admin Access" : "Admin Portal"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  {isSetup
                    ? "No admin exists yet — set up your administrator account"
                    : isReset
                    ? "Enter your registered admin email to reset your password"
                    : "Samanyanga Companion — Restricted Access"}
                </p>
              </div>

              {isSetup && (
                <div style={{
                  marginBottom: 20,
                  padding: "10px 14px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#1d4ed8",
                }}>
                  This setup can only be done once. Once your account is created, this form is permanently locked.
                </div>
              )}

              {isReset && (
                <div style={{
                  marginBottom: 20,
                  padding: "10px 14px",
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#9a3412",
                }}>
                  Enter the email address registered to the admin account and choose a new password.
                </div>
              )}

              {error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#166534" }}>
                  {success}
                </div>
              )}

              <form onSubmit={isSetup ? handleSetup : isReset ? handleReset : handleLogin}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {isSetup || isReset ? "Your Email Address" : "Admin Email"}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    style={inputStyle}
                    autoComplete="username"
                  />
                </div>

                <div style={{ marginBottom: (isSetup || isReset) ? 14 : 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {isSetup || isReset ? "New Password (min. 8 characters)" : "Password"}
                  </label>
                  <div style={{ position: "relative", marginTop: 4 }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, marginTop: 0, paddingRight: 48 }}
                      autoComplete={(isSetup || isReset) ? "new-password" : "current-password"}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: 0 }}>
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {(isSetup || isReset) && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <button type="submit" disabled={loading || !!success}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: loading || success ? "#9ca3af" : isSetup ? "#059669" : isReset ? "#dc2626" : "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: loading || success ? "not-allowed" : "pointer",
                  }}>
                  {loading
                    ? (isSetup ? "Creating account..." : isReset ? "Resetting..." : "Signing in...")
                    : isSetup ? "Create Admin Account" : isReset ? "Reset & Create Admin" : "Sign In as Admin"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
                <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
                  ← Back to Home
                </button>
                <span style={{ color: "#d1d5db", margin: "0 6px" }}>|</span>
                <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
                  User Login
                </button>
                {mode === "login" && (
                  <>
                    <span style={{ color: "#d1d5db", margin: "0 6px" }}>|</span>
                    <button onClick={() => { setMode("reset"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 13 }}>
                      Locked out?
                    </button>
                  </>
                )}
                {isReset && (
                  <>
                    <span style={{ color: "#d1d5db", margin: "0 6px" }}>|</span>
                    <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
                      Back to Login
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {!isChecking && !isSetup && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 16 }}>
            Samanyanga Companion — Admin Portal
          </p>
        )}
      </div>
    </div>
  );
}

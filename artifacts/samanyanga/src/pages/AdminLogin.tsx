import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@demo.com", password: "demo123" },
  { role: "Farmer", email: "farmer@demo.com", password: "demo123" },
  { role: "Student", email: "student@demo.com", password: "demo123" },
  { role: "Buyer", email: "buyer@demo.com", password: "demo123" },
  { role: "Seller", email: "seller@demo.com", password: "demo123" },
  { role: "Intern", email: "intern@demo.com", password: "demo123" },
];

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          marginBottom: 16,
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40 }}>🛡️</div>
            <h2 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>Admin Portal</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Samanyanga Companion — Restricted Access</p>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
              <div style={{ position: "relative", marginTop: 4 }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, marginTop: 0, paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: 0 }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", background: loading ? "#9ca3af" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign In as Admin"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
              ← Back to Home
            </button>
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 10,
          padding: 16,
          backdropFilter: "blur(6px)",
        }}>
          <button
            onClick={() => setShowDemoAccounts(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 0 }}
          >
            <p style={{ color: "#c7d2fe", fontWeight: 700, fontSize: 13, margin: 0 }}>🔑 Platform Demo Accounts</p>
            <span style={{ color: "#a5b4fc", fontSize: 12 }}>{showDemoAccounts ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {showDemoAccounts && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {DEMO_ACCOUNTS.map(({ role, email: demoEmail, password: demoPass }) => (
                <div key={demoEmail}
                  onClick={() => { setEmail(demoEmail); setPassword(demoPass); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer" }}
                  title="Click to fill credentials"
                >
                  <span style={{ color: "#e0e7ff", fontSize: 13, fontWeight: 600 }}>{role}</span>
                  <span style={{ color: "#a5b4fc", fontSize: 12 }}>{demoEmail}</span>
                  <span style={{ color: "#818cf8", fontSize: 12 }}>
                    <code style={{ background: "rgba(0,0,0,0.2)", padding: "1px 6px", borderRadius: 4 }}>{demoPass}</code>
                  </span>
                </div>
              ))}
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#818cf8", textAlign: "center" }}>Click any row to auto-fill credentials</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

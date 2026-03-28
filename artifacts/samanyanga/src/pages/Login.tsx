import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [location, navigate] = useLocation();
  const isRegister = location === "/register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await apiRequest("POST", "/api/register", { email, password, role });
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        const res = await apiRequest("POST", "/api/login", { email, password });
        localStorage.setItem("token", res.token);
        const userRole = res.user?.role;
        if (userRole === "admin") navigate("/admin");
        else if (userRole === "agri_intern") navigate("/agri-intern");
        else if (userRole === "student") navigate("/student-companion");
        else if (userRole === "merchant") navigate("/buyer");
        else if (userRole === "seller") navigate("/seller");
        else navigate("/farmer");
      }
    } catch (err: any) {
      alert(isRegister ? `Registration failed: ${err.message}` : `Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    marginTop: 4,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 50%, #1e4d2e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(6px)",
        maxWidth: 420,
        width: "100%",
        margin: "0 16px",
        padding: 32,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36 }}>🌾</div>
          <h2 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 800, color: "#111" }}>Samanyanga</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
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
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6b7280",
                  padding: 0,
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {isRegister && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{ ...inputStyle, background: "#fff" }}
              >
                <option value="farmer">Farmer</option>
                <option value="merchant">Merchant / Buyer</option>
                <option value="seller">Seller</option>
                <option value="student">Student</option>
                <option value="agri_intern">Agri Intern (Tertiary)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#9ca3af" : "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>


        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => navigate(isRegister ? "/login" : "/register")}
            style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>

        <p style={{ textAlign: "center", marginTop: 8, fontSize: 13 }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}
          >
            ← Back to Home
          </button>
        </p>
      </div>
    </div>
  );
}

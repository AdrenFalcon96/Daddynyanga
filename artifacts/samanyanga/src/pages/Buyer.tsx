import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Marketplace from "./marketplace";
import AiChatPanel from "@/components/AiChatPanel";

const TABS = [
  { key: "marketplace", label: "🛒 Browse Products" },
];

export default function Buyer() {
  const auth = useAuthGuard();
  const [tab, setTab] = useState("marketplace");
  const [, navigate] = useLocation();
  if (!auth) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🛒</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>Merchant Dashboard</h1>
            <p style={{ color: "#bfdbfe", margin: 0, fontSize: 12 }}>Browse market · Buy produce</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Logout</button>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? "#2563eb" : "#6b7280", borderBottom: tab === key ? "3px solid #2563eb" : "3px solid transparent" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, background: "#f8fafc", overflowY: "auto" }}>
        {tab === "marketplace" && <Marketplace />}
      </div>

      <AiChatPanel />
    </div>
  );
}

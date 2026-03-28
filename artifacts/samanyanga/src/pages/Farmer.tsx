import { useState } from "react";
import { useLocation } from "wouter";
import Marketplace from "./marketplace";
import Listings from "./listings";

const TABS = [
  { key: "marketplace", label: "🌽 Browse Products" },
  { key: "listings", label: "📋 My Listings" },
];

export default function Farmer() {
  const [tab, setTab] = useState("marketplace");
  const [, navigate] = useLocation();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#14532d,#166534)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🌾</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>Farmer Dashboard</h1>
            <p style={{ color: "#86efac", margin: 0, fontSize: 12 }}>Sell produce · Manage listings</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Logout</button>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", overflowX: "auto", flexShrink: 0 }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? "#16a34a" : "#6b7280", borderBottom: tab === key ? "3px solid #16a34a" : "3px solid transparent", whiteSpace: "nowrap" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, background: "#f8fafc", overflowY: "auto" }}>
        {tab === "marketplace" && <Marketplace />}
        {tab === "listings" && <Listings />}
      </div>
    </div>
  );
}

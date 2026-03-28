import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Marketplace from "./marketplace";
import Listings from "./listings";
import AiChatPanel from "@/components/AiChatPanel";

const TABS = [
  { key: "marketplace", label: "🌽 Browse Products" },
  { key: "listings", label: "📋 My Listings" },
  { key: "interns", label: "🎓 Agri Interns" },
];

interface InternRequest {
  id: string;
  student_name: string;
  student_email: string;
  institution: string;
  program: string;
  year: string;
  message?: string;
  status: string;
  response?: string;
  created_at: string;
}

function InternRequestsTab() {
  const qc = useQueryClient();
  const [respondId, setRespondId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: requests = [], isLoading } = useQuery<InternRequest[]>({
    queryKey: ["/api/intern-attachments"],
    queryFn: () => apiRequest("GET", "/api/intern-attachments"),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status, response }: { id: string; status: string; response: string }) =>
      apiRequest("PATCH", `/api/intern-attachments/${id}`, { status, response }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/intern-attachments"] });
      setRespondId(null);
      setResponseText("");
    },
    onError: (err: any) => alert("Failed: " + err.message),
  });

  const badge = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ["#92400e", "#fef3c7"],
      accepted: ["#065f46", "#d1fae5"],
      rejected: ["#991b1b", "#fee2e2"],
    };
    const [color, bg] = map[s] || ["#6b7280", "#f3f4f6"];
    return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{s}</span>;
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px" }}>Industrial Attachment Requests</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Tertiary students seeking agri-attachment opportunities on your farm.</p>
      {isLoading ? (
        <p style={{ color: "#9ca3af" }}>Loading...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40 }}>🎓</div>
          <p style={{ color: "#6b7280", marginTop: 8 }}>No intern applications yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {requests.map(r => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{r.student_name}</p>
                  <p style={{ margin: "2px 0", fontSize: 12, color: "#6b7280" }}>{r.student_email}</p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: "#374151" }}>
                    🏫 {r.institution} · 📚 {r.program} · Year {r.year}
                  </p>
                  {r.message && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151", fontStyle: "italic" }}>"{r.message}"</p>}
                  <div style={{ marginTop: 8 }}>{badge(r.status)}</div>
                  {r.response && (
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#065f46", background: "#d1fae5", padding: "6px 10px", borderRadius: 6 }}>
                      Your response: {r.response}
                    </p>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              {r.status === "pending" && (
                respondId === r.id ? (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Write your response to the student..."
                      rows={3}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => respondMutation.mutate({ id: r.id, status: "accepted", response: responseText })}
                        disabled={respondMutation.isPending}
                        style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        ✓ Accept & Respond
                      </button>
                      <button
                        onClick={() => respondMutation.mutate({ id: r.id, status: "rejected", response: responseText })}
                        disabled={respondMutation.isPending}
                        style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        ✕ Decline
                      </button>
                      <button onClick={() => setRespondId(null)} style={{ padding: "7px 14px", background: "#f3f4f6", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setRespondId(r.id); setResponseText(""); }}
                    style={{ marginTop: 12, padding: "7px 14px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    💬 Respond
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        {tab === "interns" && <InternRequestsTab />}
      </div>

      <AiChatPanel />
    </div>
  );
}

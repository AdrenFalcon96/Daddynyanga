import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AiChatPanel from "@/components/AiChatPanel";

const TABS = [
  { key: "advert-requests", label: "📋 Advert Requests" },
  { key: "product-requests", label: "🛒 Product Requests" },
  { key: "intern-requests", label: "🎓 Intern Requests" },
  { key: "consultations", label: "💬 Consultations" },
  { key: "revenue", label: "💰 Revenue" },
];

const AI_CONFIG: Record<string, { placeholder: string; greeting: string; headerLabel: string }> = {
  "advert-requests": {
    placeholder: "Ask about advert management...",
    greeting: "Hi! I can help you manage advert requests — approvals, rejections, generating content, and more.",
    headerLabel: "Advert AI",
  },
  "product-requests": {
    placeholder: "Ask about product requests...",
    greeting: "Hi! I can assist with marketplace product requests — accepting, rejecting, and tracking buyer inquiries.",
    headerLabel: "Marketplace AI",
  },
  "intern-requests": {
    placeholder: "Ask about intern management...",
    greeting: "Hi! I can help manage intern attachment requests — reviewing applications and responding to students.",
    headerLabel: "Intern AI",
  },
  "consultations": {
    placeholder: "Ask about consultations...",
    greeting: "Hi! I can help with consultation management — reviewing requests, responding to users, and tracking paid consultations.",
    headerLabel: "Consultation AI",
  },
  "revenue": {
    placeholder: "Ask about revenue and payments...",
    greeting: "Hi! I can help you understand revenue, track EcoCash payments (0783652488), and generate payment reports.",
    headerLabel: "Revenue AI",
  },
};

function useAdminCheck() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "admin" || payload.email === "admin@demo.com";
  } catch {
    return false;
  }
}

interface AdvertRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  type: string;
  status: string;
  payment_status: string;
  created_at: string;
  generated_image_url?: string;
  generated_video_url?: string;
}

interface ProductRequest {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  location: string;
  buyer_name: string;
  buyer_phone: string;
  message?: string;
  status: string;
  created_at: string;
}

interface Consultation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: string;
  message: string;
  status: string;
  response?: string;
  payment_status: string;
  payment_ref?: string;
  created_at: string;
}

function badge(s: string) {
  const c = s === "pending" ? "#92400e" : s === "approved" || s === "paid" || s === "responded" ? "#065f46" : s === "priority" || s === "accepted" ? "#1e40af" : s === "free" ? "#374151" : "#6b7280";
  const bg = s === "pending" ? "#fef3c7" : s === "approved" || s === "paid" || s === "responded" ? "#d1fae5" : s === "priority" || s === "accepted" ? "#dbeafe" : s === "free" ? "#f3f4f6" : "#f3f4f6";
  return <span style={{ background: bg, color: c, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize" as const }}>{s}</span>;
}

function AdvertRequestCard({ req, onGenImage, onGenVideo, onUpdateStatus, generating }: {
  req: AdvertRequest;
  onGenImage: (id: string) => void;
  onGenVideo: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  generating: string | null;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{req.name}</p>
          <p style={{ margin: "2px 0", fontSize: 12, color: "#6b7280" }}>{req.email} {req.phone && `· ${req.phone}`}</p>
          <p style={{ margin: "6px 0", fontSize: 13, color: "#374151" }}>{req.message}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {badge(req.status)} {badge(req.payment_status)} {badge(req.type)}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(req.created_at).toLocaleDateString()}</p>
      </div>
      {(req.generated_image_url || req.generated_video_url) && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 6, fontSize: 12, color: "#166534" }}>
          Generated: {req.generated_image_url && <a href={req.generated_image_url} target="_blank" rel="noreferrer" style={{ color: "#16a34a", marginRight: 8 }}>Image</a>}
          {req.generated_video_url && <a href={req.generated_video_url} target="_blank" rel="noreferrer" style={{ color: "#16a34a" }}>Video</a>}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={() => onGenImage(req.id)} disabled={generating === req.id}
          style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {generating === req.id ? "Generating..." : "🖼 Generate Image"}
        </button>
        <button onClick={() => onGenVideo(req.id)} disabled={generating === req.id}
          style={{ padding: "7px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          🎬 Generate Video
        </button>
        {req.status === "pending" && (
          <>
            <button onClick={() => onUpdateStatus(req.id, "approved")}
              style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ✓ Approve
            </button>
            <button onClick={() => onUpdateStatus(req.id, "rejected")}
              style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ✕ Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ConsultationCard({ c, onRespond }: { c: Consultation; onRespond: (id: string, response: string) => void }) {
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState(c.response || "");

  const typeColors: Record<string, string> = {
    student: "#6366f1", farmer: "#16a34a", buyer: "#0891b2",
    seller: "#d97706", intern: "#7c3aed", agronomic: "#dc2626",
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{c.name}</p>
            <span style={{ background: typeColors[c.type] || "#6b7280", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: "capitalize" as const }}>{c.type}</span>
          </div>
          <p style={{ margin: "2px 0", fontSize: 12, color: "#6b7280" }}>{c.email} {c.phone && `· ${c.phone}`}</p>
          <p style={{ margin: "8px 0 6px", fontSize: 13, color: "#374151", background: "#f9fafb", padding: "8px 10px", borderRadius: 6 }}>"{c.message}"</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {badge(c.status)} {badge(c.payment_status)}
            {c.payment_ref && <span style={{ fontSize: 11, color: "#9ca3af" }}>Ref: {c.payment_ref}</span>}
          </div>
          {c.response && (
            <div style={{ marginTop: 8, padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, color: "#166534" }}>
              <strong>Your response:</strong> {c.response}
            </div>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(c.created_at).toLocaleDateString()}</p>
      </div>
      {c.status !== "responded" && (
        <div style={{ marginTop: 12 }}>
          {!responding ? (
            <button onClick={() => setResponding(true)}
              style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ✍️ Respond
            </button>
          ) : (
            <div>
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Type your response..."
                rows={3}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => { onRespond(c.id, responseText); setResponding(false); }}
                  style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Send Response
                </button>
                <button onClick={() => setResponding(false)}
                  style={{ padding: "7px 14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RevenueTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/revenue"],
    queryFn: () => apiRequest("GET", "/api/admin/revenue"),
  });

  if (isLoading) return <p style={{ color: "#9ca3af" }}>Loading revenue data...</p>;
  if (!data) return null;

  const stat = (label: string, value: string | number, sub?: string, color = "#111") => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Revenue Overview</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {stat("Total Revenue", `$${data.totalRevenue}`, "Adverts + Consultations", "#16a34a")}
        {stat("Paid Adverts", data.adverts?.paid_adverts ?? 0, `of ${data.adverts?.total_adverts ?? 0} total`)}
        {stat("Paid Consultations", data.consultations?.paid_consultations ?? 0, `of ${data.consultations?.total_consultations ?? 0} total`)}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>💳 EcoCash Payment Details</p>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "#374151" }}>Account: <strong style={{ color: "#16a34a" }}>{data.ecocashAccount}</strong></p>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Advert payments: $10 (standard) · $25 (premium) · Consultation: $5 (agronomic)</p>
      </div>

      {data.recentPayments?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Recent Payments</p>
          </div>
          <div>
            {data.recentPayments.map((p: any, i: number) => (
              <div key={i} style={{ padding: "10px 16px", borderBottom: i < data.recentPayments.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{p.email} · {p.source} · {p.type}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {badge(p.payment_status)}
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("advert-requests");
  const [generating, setGenerating] = useState<string | null>(null);
  const isAdmin = useAdminCheck();
  const qc = useQueryClient();

  const { data: advertRequests = [], isLoading: loadingAdverts } = useQuery<AdvertRequest[]>({
    queryKey: ["/api/admin/advert-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/advert-requests"),
    enabled: isAdmin,
  });

  const { data: productRequests = [], isLoading: loadingProducts } = useQuery<ProductRequest[]>({
    queryKey: ["/api/admin/product-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/product-requests"),
    enabled: isAdmin,
  });

  const updateAdvertStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/advert-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/advert-requests"] }),
  });

  const updateProductStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/product-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/product-requests"] }),
  });

  const { data: internRequests = [], isLoading: loadingInterns } = useQuery<any[]>({
    queryKey: ["/api/intern-attachments"],
    queryFn: () => apiRequest("GET", "/api/intern-attachments"),
    enabled: isAdmin,
  });

  const updateInternStatus = useMutation({
    mutationFn: ({ id, status, response }: { id: string; status: string; response?: string }) =>
      apiRequest("PATCH", `/api/intern-attachments/${id}`, { status, response }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/intern-attachments"] }),
  });

  const { data: consultations = [], isLoading: loadingConsultations } = useQuery<Consultation[]>({
    queryKey: ["/api/admin/consultations"],
    queryFn: () => apiRequest("GET", "/api/admin/consultations"),
    enabled: isAdmin,
  });

  const respondConsultation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiRequest("PATCH", `/api/admin/consultations/${id}`, { response, status: "responded" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/consultations"] }),
  });

  const handleGenerate = async (requestId: string, type: "image" | "video") => {
    setGenerating(requestId);
    try {
      await apiRequest("POST", `/api/admin/generate-${type}`, { requestId });
      qc.invalidateQueries({ queryKey: ["/api/admin/advert-requests"] });
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setGenerating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <p style={{ fontWeight: 700, color: "#374151", marginTop: 12 }}>Admin access required</p>
          <p style={{ color: "#6b7280", fontSize: 13 }}>Please log in through the admin portal.</p>
          <button onClick={() => navigate("/admin-login")} style={{ marginTop: 12, padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  const aiCfg = AI_CONFIG[tab] || AI_CONFIG["advert-requests"];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26 }}>🛡</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800 }}>Admin Dashboard</h1>
            <p style={{ color: "#c7d2fe", margin: 0, fontSize: 12 }}>Samanyanga Companion</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>
          Logout
        </button>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", overflowX: "auto" }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? "#4f46e5" : "#6b7280", borderBottom: tab === key ? "3px solid #4f46e5" : "3px solid transparent", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, background: "#f8fafc", padding: 20 }}>
        {tab === "advert-requests" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Advert Requests ({advertRequests.length})</h2>
            {loadingAdverts ? <p style={{ color: "#9ca3af" }}>Loading...</p> : advertRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "#9ca3af" }}>No advert requests yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {advertRequests.map(r => (
                  <AdvertRequestCard key={r.id} req={r} generating={generating}
                    onGenImage={(id) => handleGenerate(id, "image")}
                    onGenVideo={(id) => handleGenerate(id, "video")}
                    onUpdateStatus={(id, status) => updateAdvertStatus.mutate({ id, status })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "product-requests" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Product Requests ({productRequests.length})</h2>
            {loadingProducts ? <p style={{ color: "#9ca3af" }}>Loading...</p> : productRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "#9ca3af" }}>No product requests yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {productRequests.map(r => (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{r.buyer_name}</p>
                        <p style={{ margin: "2px 0 6px", fontSize: 12, color: "#6b7280" }}>{r.buyer_phone}</p>
                        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>Product: <strong>{r.product_name}</strong> — ${r.product_price} · 📍 {r.location}</p>
                        {r.message && <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{r.message}</p>}
                        <div style={{ marginTop: 6 }}>{badge(r.status)}</div>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => updateProductStatus.mutate({ id: r.id, status: "accepted" })}
                          style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          ✓ Accept
                        </button>
                        <button onClick={() => updateProductStatus.mutate({ id: r.id, status: "rejected" })}
                          style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "intern-requests" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Intern Attachment Requests ({internRequests.length})</h2>
            {loadingInterns ? <p style={{ color: "#9ca3af" }}>Loading...</p> : internRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No intern requests yet</p></div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {internRequests.map((r: any) => (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{r.student_name}</p>
                        <p style={{ margin: "2px 0", fontSize: 12, color: "#6b7280" }}>{r.student_email}</p>
                        <p style={{ margin: "4px 0", fontSize: 13, color: "#374151" }}>🏫 {r.institution} · 📚 {r.program} · Year {r.year}</p>
                        {r.message && <p style={{ margin: "4px 0", fontSize: 13, color: "#374151", fontStyle: "italic" }}>"{r.message}"</p>}
                        {badge(r.status)}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => updateInternStatus.mutate({ id: r.id, status: "accepted", response: "Your application has been accepted. Please contact us to arrange start date." })}
                          style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          ✓ Accept
                        </button>
                        <button onClick={() => updateInternStatus.mutate({ id: r.id, status: "rejected", response: "Unfortunately we cannot accommodate your request at this time." })}
                          style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "consultations" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Consultation Requests ({consultations.length})</h2>
            {loadingConsultations ? <p style={{ color: "#9ca3af" }}>Loading...</p> : consultations.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No consultation requests yet</p></div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {consultations.map(c => (
                  <ConsultationCard key={c.id} c={c}
                    onRespond={(id, response) => respondConsultation.mutate({ id, response })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "revenue" && <RevenueTab />}
      </div>

      <AiChatPanel
        key={tab}
        section={tab}
        endpoint="/api/ai/admin"
        placeholder={aiCfg.placeholder}
        greeting={aiCfg.greeting}
        headerLabel={aiCfg.headerLabel}
      />
    </div>
  );
}

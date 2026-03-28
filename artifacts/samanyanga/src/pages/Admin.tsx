import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const TABS = [
  { key: "advert-requests", label: "📋 Advert Requests" },
  { key: "product-requests", label: "🛒 Product Requests" },
];

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

function AdvertRequestCard({ req, onGenImage, onGenVideo, onUpdateStatus, generating }: {
  req: AdvertRequest;
  onGenImage: (id: string) => void;
  onGenVideo: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  generating: string | null;
}) {
  const badge = (s: string) => {
    const c = s === "pending" ? "#92400e" : s === "approved" || s === "paid" ? "#065f46" : s === "priority" ? "#1e40af" : "#6b7280";
    const bg = s === "pending" ? "#fef3c7" : s === "approved" || s === "paid" ? "#d1fae5" : s === "priority" ? "#dbeafe" : "#f3f4f6";
    return <span style={{ background: bg, color: c, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{s}</span>;
  };
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
        <button
          onClick={() => onGenImage(req.id)}
          disabled={generating === req.id}
          style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {generating === req.id ? "Generating..." : "🖼 Generate Image"}
        </button>
        <button
          onClick={() => onGenVideo(req.id)}
          disabled={generating === req.id}
          style={{ padding: "7px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
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
          <p style={{ color: "#6b7280", fontSize: 13 }}>Log in with admin@demo.com / demo123</p>
          <button onClick={() => navigate("/login")} style={{ marginTop: 12, padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex" }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? "#4f46e5" : "#6b7280", borderBottom: tab === key ? "3px solid #4f46e5" : "3px solid transparent" }}>
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
                  <AdvertRequestCard
                    key={r.id}
                    req={r}
                    generating={generating}
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
                        <div style={{ marginTop: 6 }}>
                          <span style={{
                            background: r.status === "accepted" ? "#d1fae5" : r.status === "rejected" ? "#fee2e2" : "#fef3c7",
                            color: r.status === "accepted" ? "#065f46" : r.status === "rejected" ? "#991b1b" : "#92400e",
                            padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize"
                          }}>{r.status}</span>
                        </div>
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
      </div>
    </div>
  );
}

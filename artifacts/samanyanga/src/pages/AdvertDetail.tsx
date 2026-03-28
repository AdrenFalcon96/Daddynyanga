import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  imageUrl?: string;
  video_url?: string;
  videoUrl?: string;
  whatsapp?: string;
  type: string;
}

export default function AdvertDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: ad, isLoading, isError } = useQuery<Ad>({
    queryKey: [`/api/ads/${id}`],
    queryFn: () => apiRequest("GET", `/api/ads/${id}`),
    enabled: !!id,
  });

  const imageUrl = ad?.image_url || ad?.imageUrl;
  const videoUrl = ad?.video_url || ad?.videoUrl;
  const shareText = ad ? encodeURIComponent(`Check out this advert: ${ad.title} — `) : "";
  const pageUrl = encodeURIComponent(window.location.href);

  const handleSimilar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/advert-requests", {
        ...form,
        message: `Similar to ad "${ad?.title}": ${form.message}`,
      });
      alert("Request submitted! We will contact you soon.");
      setShowRequest(false);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#6b7280" }}>Loading advert...</p>
      </div>
    );
  }

  if (isError || !ad) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <p style={{ fontWeight: 700, color: "#374151", marginTop: 12 }}>Advert not found</p>
        <button onClick={() => navigate("/public-ads")} style={{ marginTop: 12, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          Back to Adverts
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3c2e,#2d5a3d)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/public-ads")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Adverts</button>
        <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800 }}>Advert Detail</h1>
      </div>

      <div style={{ maxWidth: 720, margin: "24px auto", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
          {imageUrl || videoUrl ? (
            <div style={{ display: "flex", minHeight: 280 }}>
              {imageUrl && (
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <img src={imageUrl} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              )}
              {videoUrl && (
                <div style={{ flex: 1, background: "#000" }}>
                  <video controls style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                    <source src={videoUrl} />
                  </video>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 200, background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>📣</div>
          )}

          <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", margin: "0 0 10px" }}>{ad.title}</h2>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, margin: "0 0 24px" }}>{ad.description}</p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {ad.whatsapp && (
                <a
                  href={`https://wa.me/${ad.whatsapp}?text=${shareText}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: "10px 20px", background: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  💬 WhatsApp
                </a>
              )}
              <a href={`https://facebook.com/sharer/sharer.php?u=${pageUrl}`} target="_blank" rel="noreferrer"
                style={{ padding: "10px 20px", background: "#1877F2", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                📘 Share on Facebook
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${pageUrl}`} target="_blank" rel="noreferrer"
                style={{ padding: "10px 20px", background: "#111", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                ✕ Share on X
              </a>
            </div>

            <button
              onClick={() => setShowRequest(true)}
              style={{ padding: "11px 24px", background: "linear-gradient(135deg,#1a3c2e,#16a34a)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              📋 Request Similar Ad
            </button>
          </div>
        </div>
      </div>

      {showRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "min(440px,95vw)", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 800 }}>Request Similar Ad</h3>
            <form onSubmit={handleSimilar}>
              {(["name", "email", "phone", "message"] as const).map(field => (
                <div key={field} style={{ marginBottom: 11 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>{field === "message" ? "What do you need?" : field}</label>
                  {field === "message" ? (
                    <textarea
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      rows={3}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box", resize: "vertical" }}
                    />
                  ) : (
                    <input
                      type={field === "email" ? "email" : "text"}
                      required={field !== "phone"}
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                    />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  {submitting ? "Sending..." : "Submit Request"}
                </button>
                <button type="button" onClick={() => setShowRequest(false)} style={{ padding: "10px 16px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

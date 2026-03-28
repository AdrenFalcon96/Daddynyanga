import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

function ShareButtons({ ad }: { ad: Ad }) {
  const shareText = encodeURIComponent(`Check out this advert: ${ad.title}`);
  const url = encodeURIComponent(window.location.href);
  const links = [
    { label: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${shareText}%20${url}`, icon: "💬" },
    { label: "Facebook", color: "#1877F2", href: `https://facebook.com/sharer/sharer.php?u=${url}`, icon: "📘" },
    { label: "Instagram", color: "#E1306C", href: `https://instagram.com`, icon: "📸" },
    { label: "X", color: "#000", href: `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`, icon: "✕" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
      {links.map(l => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "6px 14px",
            background: l.color,
            color: "#fff",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>{l.icon}</span> {l.label}
        </a>
      ))}
    </div>
  );
}

function AdCard({ ad }: { ad: Ad }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      overflow: "hidden",
      border: "1px solid #e5e7eb",
    }}>
      <div style={{ display: "flex", height: 200 }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {ad.imageUrl ? (
            <img src={ad.imageUrl} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📣</div>
          )}
        </div>
        {ad.videoUrl && (
          <div style={{ flex: 1, background: "#000" }}>
            <video controls style={{ width: "100%", height: "100%", objectFit: "cover" }}>
              <source src={ad.videoUrl} />
            </video>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 20px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{ad.title}</h3>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>{ad.description}</p>
        <ShareButtons ad={ad} />
      </div>
    </div>
  );
}

function RequestAdForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", description: "" });
  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/advert-requests", data),
    onSuccess: () => { alert("Request submitted! We'll contact you soon."); onClose(); },
    onError: (err: any) => alert("Failed to submit: " + err.message),
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "min(440px,95vw)", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>Request Custom Ad</h3>
        {(["name", "email", "phone", "description"] as const).map(field => (
          <div key={field} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>{field}</label>
            {field === "description" ? (
              <textarea
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                rows={3}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box", resize: "vertical" }}
              />
            ) : (
              <input
                type={field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
              />
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            style={{ flex: 1, padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            {mutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
          <button
            onClick={onClose}
            style={{ padding: "10px 16px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicAds() {
  const [, navigate] = useLocation();
  const [showRequest, setShowRequest] = useState(false);

  const { data: ads = [], isLoading } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
    queryFn: () => apiRequest("GET", "/api/ads"),
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3c2e,#2d5a3d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Back</button>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 900 }}>📣 Public Adverts</h1>
            <p style={{ color: "#86efac", margin: 0, fontSize: 12 }}>Discover local businesses and opportunities</p>
          </div>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          + Request Custom Ad
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading adverts...</div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ color: "#374151", fontWeight: 700, fontSize: 18, marginTop: 12 }}>No adverts yet</p>
            <p style={{ color: "#6b7280", marginTop: 4 }}>Be the first to advertise here!</p>
            <button
              onClick={() => setShowRequest(true)}
              style={{ marginTop: 16, padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              Request an Ad
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}
      </div>

      {showRequest && <RequestAdForm onClose={() => setShowRequest(false)} />}
    </div>
  );
}

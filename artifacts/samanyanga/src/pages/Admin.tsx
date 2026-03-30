import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AiChatPanel from "@/components/AiChatPanel";

const TABS = [
  { key: "image-adverts", label: "🖼 Image Adverts" },
  { key: "video-adverts", label: "🎬 Video Adverts" },
  { key: "media-hub", label: "📤 Media Hub" },
  { key: "product-requests", label: "🛒 Products" },
  { key: "intern-requests", label: "🎓 Interns" },
  { key: "consultations", label: "💬 Consultations" },
  { key: "revenue", label: "💰 Revenue" },
  { key: "study-materials", label: "📚 Study Materials" },
  { key: "subjects", label: "📖 Subjects" },
  { key: "security", label: "🔐 Security & Access" },
];

const AI_CONFIG: Record<string, { placeholder: string; greeting: string; headerLabel: string }> = {
  "image-adverts": { placeholder: "Ask about image advert management...", greeting: "Hi! I can help you manage image advert requests — approvals, image generation, and publishing.", headerLabel: "Image Advert AI" },
  "video-adverts": { placeholder: "Ask about video advert management...", greeting: "Hi! I can help you manage video advert requests — video generation, approvals, and publishing.", headerLabel: "Video Advert AI" },
  "media-hub": { placeholder: "Ask about media distribution...", greeting: "Hi! I can help you upload, edit, publish, and distribute media to social platforms.", headerLabel: "Media Hub AI" },
  "product-requests": { placeholder: "Ask about product requests...", greeting: "Hi! I can assist with marketplace product requests — accepting, rejecting, and tracking buyer inquiries.", headerLabel: "Marketplace AI" },
  "intern-requests": { placeholder: "Ask about intern management...", greeting: "Hi! I can help manage intern attachment requests.", headerLabel: "Intern AI" },
  "consultations": { placeholder: "Ask about consultations...", greeting: "Hi! I can help with consultation management.", headerLabel: "Consultation AI" },
  "revenue": { placeholder: "Ask about revenue and payments...", greeting: "Hi! I can help you understand revenue, track EcoCash payments (0783652488), and generate reports.", headerLabel: "Revenue AI" },
  "study-materials": { placeholder: "Ask about study materials...", greeting: "Hi! I can help you organise and upload study materials for students.", headerLabel: "Study Materials AI" },
  "subjects": { placeholder: "Ask about subject management...", greeting: "Hi! I can help you add, edit, and organise subjects by grade level.", headerLabel: "Subjects AI" },
  "security": { placeholder: "Ask about security and accounts...", greeting: "Hi! I can help you manage accounts, review user access, and advise on platform security.", headerLabel: "Security AI" },
};

function useAdminCheck() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "admin";
  } catch { return false; }
}

function badge(s: string) {
  const c = s === "pending" ? "#92400e" : ["approved","paid","responded","accepted"].includes(s) ? "#065f46" : s === "priority" ? "#1e40af" : "#6b7280";
  const bg = s === "pending" ? "#fef3c7" : ["approved","paid","responded","accepted"].includes(s) ? "#d1fae5" : s === "priority" ? "#dbeafe" : "#f3f4f6";
  return <span style={{ background: bg, color: c, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize" as const }}>{s}</span>;
}

interface AdvertRequest {
  id: string; name: string; email: string; phone?: string; message: string;
  type: string; status: string; payment_status: string; created_at: string;
  generated_image_url?: string; generated_video_url?: string; advert_type?: string;
}

function AdvertCard({ req, type, onGenImage, onGenVideo, onUpdateStatus, onPublish, generating }: {
  req: AdvertRequest; type: "image" | "video";
  onGenImage: (id: string) => void; onGenVideo: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onPublish: (id: string) => void;
  generating: string | null;
}) {
  const mediaUrl = type === "image" ? req.generated_image_url : req.generated_video_url;
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        // Save as generated media URL (use a data URL stored temporarily or an object URL)
        const field = type === "image" ? "generated_image_url" : "generated_video_url";
        await apiRequest("PATCH", `/api/admin/advert-requests/${req.id}`, { status: "approved", advert_type: type });
        // Also update the ads table
        await apiRequest("POST", "/api/admin/ads", {
          title: req.name,
          description: req.message,
          [type === "image" ? "image_url" : "video_url"]: dataUrl,
          type,
          published: false,
        });
        qc.invalidateQueries({ queryKey: ["/api/admin/advert-requests"] });
        qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      } catch (err: any) { alert("Upload failed: " + err.message); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{req.name}</p>
          <p style={{ margin: "2px 0", fontSize: 12, color: "#6b7280" }}>{req.email} {req.phone && `· ${req.phone}`}</p>
          <p style={{ margin: "6px 0", fontSize: 13, color: "#374151" }}>{req.message}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {badge(req.status)} {badge(req.payment_status)} {badge(req.type)}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(req.created_at).toLocaleDateString()}</p>
      </div>

      {mediaUrl && (
        <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          {type === "image"
            ? <img src={mediaUrl} alt="Ad" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
            : <video src={mediaUrl} controls style={{ width: "100%", maxHeight: 200 }} />}
          <div style={{ display: "flex", gap: 8, padding: "8px 12px", background: "#f0fdf4" }}>
            <a href={mediaUrl} target="_blank" rel="noreferrer" style={{ color: "#16a34a", fontSize: 12, fontWeight: 600 }}>👁 Preview</a>
            <a href={mediaUrl} download={`ad-${req.id}.${type === "image" ? "jpg" : "mp4"}`} style={{ color: "#4f46e5", fontSize: 12, fontWeight: 600 }}>⬇ Download</a>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {type === "image" ? (
          <button onClick={() => onGenImage(req.id)} disabled={generating === req.id}
            style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {generating === req.id ? "Generating..." : "🤖 AI Generate"}
          </button>
        ) : (
          <button onClick={() => onGenVideo(req.id)} disabled={generating === req.id}
            style={{ padding: "7px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {generating === req.id ? "Generating..." : "🤖 AI Generate"}
          </button>
        )}
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ padding: "7px 14px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {uploading ? "Uploading..." : `📁 Upload ${type === "image" ? "Image" : "Video"}`}
        </button>
        <input ref={fileRef} type="file" accept={type === "image" ? "image/*" : "video/*"} style={{ display: "none" }} onChange={handleManualUpload} />
        {mediaUrl && (
          <button onClick={() => onPublish(req.id)}
            style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📢 Publish
          </button>
        )}
        {req.status === "pending" && (
          <>
            <button onClick={() => onUpdateStatus(req.id, "approved")}
              style={{ padding: "7px 14px", background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
            <button onClick={() => onUpdateStatus(req.id, "rejected")}
              style={{ padding: "7px 14px", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ Reject</button>
          </>
        )}
      </div>
    </div>
  );
}

interface Ad {
  id: string; title: string; description?: string; image_url?: string; video_url?: string;
  type: string; whatsapp?: string; published: boolean; created_at: string;
}

function MediaHubTab() {
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "create">("list");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [distributeAd, setDistributeAd] = useState<Ad | null>(null);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", video_url: "", type: "image", whatsapp: "", published: false });
  const [copyMsg, setCopyMsg] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: ads = [], isLoading } = useQuery<Ad[]>({
    queryKey: ["/api/admin/ads"],
    queryFn: () => apiRequest("GET", "/api/admin/ads"),
  });

  const createAd = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/admin/ads", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/ads"] }); setView("list"); setForm({ title: "", description: "", image_url: "", video_url: "", type: "image", whatsapp: "", published: false }); },
    onError: (err: any) => alert("Failed: " + err.message),
  });
  const updateAd = useMutation({
    mutationFn: ({ id, ...data }: Partial<Ad> & { id: string }) => apiRequest("PATCH", `/api/admin/ads/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/ads"] }); setEditingAd(null); },
    onError: (err: any) => alert("Failed: " + err.message),
  });
  const deleteAd = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/ads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/ads"] }),
    onError: (err: any) => alert("Delete failed: " + err.message),
  });

  const getSocialLinks = (ad: Ad) => {
    const text = encodeURIComponent(`${ad.title}${ad.description ? " — " + ad.description : ""}`);
    const media = encodeURIComponent(ad.image_url || ad.video_url || "https://samanyanga.replit.app");
    const wa = ad.whatsapp ? ad.whatsapp.replace(/\D/g, "") : "";
    return {
      whatsapp: wa ? `https://wa.me/${wa}?text=${text}` : `https://wa.me/?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${media}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${media}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${media}&title=${text}`,
    };
  };

  const getApiPayload = (ad: Ad) => JSON.stringify({
    id: ad.id, title: ad.title, description: ad.description,
    mediaUrl: ad.image_url || ad.video_url, type: ad.type,
    whatsapp: ad.whatsapp, published: ad.published,
    shareLinks: getSocialLinks(ad),
  }, null, 2);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopyMsg(label + " copied!"); setTimeout(() => setCopyMsg(""), 2500); });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit && editingAd) {
        setEditingAd(ea => ea ? { ...ea, [form.type === "image" ? "image_url" : "video_url"]: dataUrl } : ea);
      } else {
        setForm(f => ({ ...f, [f.type === "image" ? "image_url" : "video_url"]: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/ai/generate-image", { prompt: aiPrompt });
      setForm(f => ({ ...f, image_url: res.imageUrl, type: "image" }));
    } catch (err: any) { alert("AI generation failed: " + err.message); }
    finally { setGenerating(false); }
  };

  const btn = (label: string, onClick: () => void, color = "#4f46e5") => (
    <button onClick={onClick} style={{ padding: "6px 14px", background: color, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>
  );
  const inp = (label: string, child: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      {child}
    </div>
  );
  const textInput = (value: string, onChange: (v: string) => void, placeholder = "") => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const }} />
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>📤 Media Hub</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {btn(view === "list" ? "➕ New Ad" : "← Back to List", () => setView(v => v === "list" ? "create" : "list"))}
        </div>
      </div>

      {copyMsg && <div style={{ marginBottom: 12, padding: "8px 14px", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, fontSize: 13, color: "#065f46" }}>{copyMsg}</div>}

      {view === "create" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 14 }}>Create New Ad</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {inp("Title *", textInput(form.title, v => setForm(f => ({ ...f, title: v })), "e.g. Fresh Tomatoes from Masvingo"))}
            {inp("Type", <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
              <option value="image">Image Ad</option>
              <option value="video">Video Ad</option>
            </select>)}
          </div>
          {inp("Description", <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, resize: "vertical" }} />)}
          {form.type === "image" && inp("Image URL or upload", <div style={{ display: "flex", gap: 8 }}>
            {textInput(form.image_url, v => setForm(f => ({ ...f, image_url: v })), "https://... or use upload")}
            <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 14px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>📁 Upload</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileUpload(e)} />
          </div>)}
          {form.type === "video" && inp("Video URL or upload", <div style={{ display: "flex", gap: 8 }}>
            {textInput(form.video_url, v => setForm(f => ({ ...f, video_url: v })), "https://...")}
            <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 14px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>📁 Upload</button>
            <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => handleFileUpload(e)} />
          </div>)}

          {form.type === "image" && (
            <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#374151" }}>🤖 AI Image Generation</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe the image you want to generate..."
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
                <button onClick={handleAiGenerate} disabled={generating}
                  style={{ padding: "8px 16px", background: generating ? "#9ca3af" : "#7c3aed", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                  {generating ? "Generating..." : "✨ Generate"}
                </button>
              </div>
            </div>
          )}

          {form.image_url && form.type === "image" && (
            <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              <img src={form.image_url} alt="Preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {inp("WhatsApp (with country code)", textInput(form.whatsapp, v => setForm(f => ({ ...f, whatsapp: v })), "e.g. 263771234567"))}
            {inp("Publish immediately", <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
              <span style={{ fontSize: 13 }}>{form.published ? "Yes — visible publicly" : "No — save as draft"}</span>
            </label>)}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={() => createAd.mutate(form)} disabled={!form.title}
              style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              💾 Save Ad
            </button>
            <button onClick={() => setView("list")}
              style={{ padding: "10px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? <p style={{ color: "#9ca3af" }}>Loading ads...</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {ads.length === 0 && <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No ads yet. Create your first ad above.</p></div>}
          {ads.map(ad => (
            <div key={ad.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
              {editingAd?.id === ad.id ? (
                <div>
                  <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>✏️ Editing: {ad.title}</p>
                  {inp("Title", textInput(editingAd.title, v => setEditingAd(e => e ? { ...e, title: v } : e)))}
                  {inp("Description", <textarea value={editingAd.description || ""} onChange={e => setEditingAd(ea => ea ? { ...ea, description: e.target.value } : ea)} rows={2}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, resize: "vertical" }} />)}
                  {inp("Image URL", textInput(editingAd.image_url || "", v => setEditingAd(e => e ? { ...e, image_url: v } : e)))}
                  {inp("Video URL", textInput(editingAd.video_url || "", v => setEditingAd(e => e ? { ...e, video_url: v } : e)))}
                  {inp("WhatsApp", textInput(editingAd.whatsapp || "", v => setEditingAd(e => e ? { ...e, whatsapp: v } : e)))}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {btn("💾 Save", () => updateAd.mutate({ id: editingAd.id, title: editingAd.title, description: editingAd.description, image_url: editingAd.image_url, video_url: editingAd.video_url, whatsapp: editingAd.whatsapp }), "#16a34a")}
                    {btn("Cancel", () => setEditingAd(null), "#6b7280")}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 12 }}>
                    {(ad.image_url || ad.video_url) && (
                      <div style={{ width: 80, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                        {ad.type === "image"
                          ? <img src={ad.image_url} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <video src={ad.video_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{ad.title}</p>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: ad.published ? "#d1fae5" : "#f3f4f6", color: ad.published ? "#065f46" : "#6b7280" }}>
                          {ad.published ? "● Live" : "○ Draft"}
                        </span>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "#e0e7ff", color: "#4338ca" }}>{ad.type}</span>
                      </div>
                      {ad.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>{ad.description}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {btn("✏️ Edit", () => setEditingAd(ad))}
                    {btn(ad.published ? "⏸ Unpublish" : "📢 Publish", () => updateAd.mutate({ id: ad.id, published: !ad.published }), ad.published ? "#d97706" : "#16a34a")}
                    {btn("🌐 Distribute", () => setDistributeAd(distributeAd?.id === ad.id ? null : ad), "#0891b2")}
                    {btn("🗑 Delete", () => { if (confirm("Delete this ad?")) deleteAd.mutate(ad.id); }, "#dc2626")}
                  </div>

                  {distributeAd?.id === ad.id && (
                    <div style={{ marginTop: 12, padding: 16, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13 }}>🌐 Media Distribution Hub</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {Object.entries(getSocialLinks(ad)).map(([platform, link]) => (
                          <a key={platform} href={link} target="_blank" rel="noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 600 }}>
                            <span>{platform === "whatsapp" ? "💬" : platform === "facebook" ? "👥" : platform === "twitter" ? "🐦" : "💼"}</span>
                            <span style={{ textTransform: "capitalize" }}>{platform}</span>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>Share ↗</span>
                          </a>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => copy(ad.image_url || ad.video_url || "", "Media URL")}
                          style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>📋 Copy Media URL</button>
                        <button onClick={() => copy(getApiPayload(ad), "API payload")}
                          style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>📦 Copy API Payload</button>
                      </div>
                      <details style={{ marginTop: 10 }}>
                        <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}>View API Payload (JSON)</summary>
                        <pre style={{ marginTop: 8, fontSize: 11, background: "#1e1b4b", color: "#c7d2fe", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 200 }}>{getApiPayload(ad)}</pre>
                      </details>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getSocialLinks(ad: Ad) {
  const text = encodeURIComponent(`${ad.title}${ad.description ? " — " + ad.description : ""}`);
  const media = encodeURIComponent(ad.image_url || ad.video_url || "https://samanyanga.replit.app");
  const wa = ad.whatsapp ? ad.whatsapp.replace(/\D/g, "") : "";
  return {
    whatsapp: wa ? `https://wa.me/${wa}?text=${text}` : `https://wa.me/?text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${media}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${media}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${media}&title=${text}`,
  };
}

interface Subject { id: string; name: string; grade: string; category?: string; active: boolean; }

function SubjectsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", grade: "olevel", category: "" });
  const [editing, setEditing] = useState<Subject | null>(null);
  const [msg, setMsg] = useState("");

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects"],
    queryFn: () => apiRequest("GET", "/api/admin/subjects"),
  });

  const createSubject = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/admin/subjects", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/subjects"] }); setForm(f => ({ ...f, name: "", category: "" })); setMsg("✅ Subject added!"); setTimeout(() => setMsg(""), 3000); },
    onError: (err: any) => setMsg("❌ " + err.message),
  });
  const updateSubject = useMutation({
    mutationFn: ({ id, ...data }: Partial<Subject> & { id: string }) => apiRequest("PATCH", `/api/admin/subjects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/subjects"] }); setEditing(null); },
    onError: (err: any) => alert("Update failed: " + err.message),
  });
  const deleteSubject = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/subjects"] }),
    onError: (err: any) => alert("Delete failed: " + err.message),
  });

  const gradeLabel = (g: string) => g === "grade7" ? "Grade 7" : g === "olevel" ? "O Level" : "A Level";
  const gradeColor: Record<string, string> = { grade7: "#0891b2", olevel: "#7c3aed", alevel: "#16a34a" };
  const byGrade = (g: string) => subjects.filter(s => s.grade === g);

  const inp = (label: string, child: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      {child}
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>📖 Subject Management</h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>Manage ZIMSEC subjects dynamically. Changes reflect immediately in the Study Companion.</p>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>➕ Add New Subject</p>
        {msg && <p style={{ fontSize: 13, margin: "0 0 10px", color: msg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{msg}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          {inp("Subject Name *", <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const }} />)}
          {inp("Grade Level", <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
            <option value="grade7">Grade 7</option>
            <option value="olevel">O Level</option>
            <option value="alevel">A Level</option>
          </select>)}
          {inp("Category", <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Sciences"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const }} />)}
          <div>
            <button onClick={() => createSubject.mutate(form)} disabled={!form.name}
              style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Add
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <p style={{ color: "#9ca3af" }}>Loading subjects...</p> : (
        <div style={{ display: "grid", gap: 16 }}>
          {(["grade7", "olevel", "alevel"] as const).map(grade => (
            <div key={grade} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: gradeColor[grade], display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{gradeLabel(grade)}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{byGrade(grade).length} subjects</span>
              </div>
              <div>
                {byGrade(grade).length === 0 ? (
                  <p style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>No subjects yet</p>
                ) : byGrade(grade).map(s => (
                  <div key={s.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10 }}>
                    {editing?.id === s.id ? (
                      <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input value={editing.name} onChange={e => setEditing(ed => ed ? { ...ed, name: e.target.value } : ed)}
                          style={{ flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
                        <input value={editing.category || ""} onChange={e => setEditing(ed => ed ? { ...ed, category: e.target.value } : ed)} placeholder="Category"
                          style={{ width: 120, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
                        <button onClick={() => updateSubject.mutate({ id: editing.id, name: editing.name, category: editing.category })}
                          style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEditing(null)}
                          style={{ padding: "6px 12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: s.active ? "#111" : "#9ca3af" }}>{s.name}</span>
                          {s.category && <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>{s.category}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => updateSubject.mutate({ id: s.id, active: !s.active })}
                            style={{ padding: "4px 10px", background: s.active ? "#fef3c7" : "#d1fae5", color: s.active ? "#92400e" : "#065f46", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            {s.active ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => setEditing(s)}
                            style={{ padding: "4px 10px", background: "#e0e7ff", color: "#4338ca", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteSubject.mutate(s.id); }}
                            style={{ padding: "4px 10px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Consultation {
  id: string; name: string; email: string; phone?: string; type: string;
  message: string; status: string; response?: string; payment_status: string;
  payment_ref?: string; created_at: string;
}

function ConsultationCard({ c, onRespond }: { c: Consultation; onRespond: (id: string, response: string) => void }) {
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState(c.response || "");
  const typeColors: Record<string, string> = { student: "#6366f1", farmer: "#16a34a", buyer: "#0891b2", seller: "#d97706", intern: "#7c3aed", agronomic: "#dc2626" };
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{badge(c.status)} {badge(c.payment_status)}</div>
          {c.response && <div style={{ marginTop: 8, padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, color: "#166534" }}><strong>Response:</strong> {c.response}</div>}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(c.created_at).toLocaleDateString()}</p>
      </div>
      {c.status !== "responded" && (
        <div style={{ marginTop: 12 }}>
          {!responding ? (
            <button onClick={() => setResponding(true)} style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✍️ Respond</button>
          ) : (
            <div>
              <textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Type your response..." rows={3}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => { onRespond(c.id, responseText); setResponding(false); }}
                  style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
                <button onClick={() => setResponding(false)} style={{ padding: "7px 14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RevenueTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/admin/revenue"], queryFn: () => apiRequest("GET", "/api/admin/revenue") });
  const { data: transactions = [], isLoading: loadingTx } = useQuery<any[]>({ queryKey: ["/api/admin/transactions"], queryFn: () => apiRequest("GET", "/api/admin/transactions") });
  const updatePayment = useMutation({
    mutationFn: ({ source, id, status }: { source: string; id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/transactions/${source}/${id}`, { payment_status: status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/transactions"] }); qc.invalidateQueries({ queryKey: ["/api/admin/revenue"] }); },
    onError: (err: any) => alert("Payment update failed: " + (err?.message || "Unknown error")),
  });
  if (isLoading) return <p style={{ color: "#9ca3af" }}>Loading revenue data...</p>;
  const stat = (label: string, value: string | number, sub?: string, color = "#111") => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{sub}</p>}
    </div>
  );
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Revenue Overview</h2>
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            {stat("Total Revenue", `$${data.totalRevenue}`, "Adverts + Consultations", "#16a34a")}
            {stat("Paid Adverts", data.adverts?.paid_adverts ?? 0, `of ${data.adverts?.total_adverts ?? 0} total`)}
            {stat("Paid Consultations", data.consultations?.paid_consultations ?? 0, `of ${data.consultations?.total_consultations ?? 0} total`)}
          </div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14 }}>💳 EcoCash Payment Connection</p>
            <p style={{ margin: "0 0 4px", fontSize: 14, color: "#374151" }}>Account: <strong style={{ color: "#16a34a" }}>{data.ecocashAccount}</strong></p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Standard Advert: $10 · Premium Advert: $25 · Agronomic Consultation: $5</p>
          </div>
        </>
      )}
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>All Transactions</h3>
      {loadingTx ? <p style={{ color: "#9ca3af" }}>Loading transactions...</p> : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          {transactions.length === 0 ? (
            <p style={{ padding: 20, color: "#9ca3af", textAlign: "center" }}>No transactions yet</p>
          ) : transactions.map((t: any) => (
            <div key={`${t.source}-${t.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{t.email} · {t.source} · {t.type}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {badge(t.payment_status)}
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(t.created_at).toLocaleDateString()}</span>
                {t.payment_status !== "paid" && (
                  <button onClick={() => updatePayment.mutate({ source: t.source, id: t.id, status: "paid" })}
                    style={{ padding: "4px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓ Mark Paid</button>
                )}
                {t.payment_status === "paid" && (
                  <button onClick={() => updatePayment.mutate({ source: t.source, id: t.id, status: "refunded" })}
                    style={{ padding: "4px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↩ Refund</button>
                )}
                {t.payment_status === "refunded" && (
                  <button onClick={() => updatePayment.mutate({ source: t.source, id: t.id, status: "pending" })}
                    style={{ padding: "4px 10px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↺ Reset</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudyMaterialsTab() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", grade: "olevel", subject: "", file_type: "pdf" });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [filePreview, setFilePreview] = useState<{ name: string; data: string; mime: string } | null>(null);
  const { data: materials = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/study-materials"], queryFn: () => apiRequest("GET", "/api/admin/study-materials") });
  const deleteMaterial = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/study-materials/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/study-materials"] }) });
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFilePreview({ name: file.name, data: reader.result as string, mime: file.type });
    reader.readAsDataURL(file);
  };
  const handleUpload = async () => {
    if (!form.title || !form.grade) { setUploadMsg("Title and grade are required."); return; }
    if (!filePreview && form.file_type !== "url") { setUploadMsg("Please select a file."); return; }
    setUploading(true); setUploadMsg("");
    try {
      await apiRequest("POST", "/api/admin/study-materials", { ...form, file_data: filePreview?.data || null, file_name: filePreview?.name || null, mime_type: filePreview?.mime || null });
      setUploadMsg("✅ Material uploaded successfully!");
      setForm({ title: "", description: "", grade: "olevel", subject: "", file_type: "pdf" });
      setFilePreview(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["/api/admin/study-materials"] });
    } catch (err: any) { setUploadMsg("❌ Upload failed: " + err.message); }
    finally { setUploading(false); }
  };
  const inp = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>{children}</div>
  );
  const sel = (val: string, onChange: (v: string) => void, opts: [string, string][]) => (
    <select value={val} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff" }}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Study Materials Manager</h2>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14 }}>📤 Upload New Material</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {inp("Title *", <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Quadratic Equations Notes"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const }} />)}
          {inp("Grade Level *", sel(form.grade, v => setForm(f => ({ ...f, grade: v })), [["grade7","Grade 7"],["olevel","O Level"],["alevel","A Level"]]))}
          {inp("Subject", <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const }} />)}
          {inp("File Type", sel(form.file_type, v => setForm(f => ({ ...f, file_type: v })), [["pdf","PDF Document"],["image","Image"],["video","Video (URL)"],["url","External URL"]]))}
        </div>
        {inp("Description", <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..."
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, resize: "vertical" }} />)}
        {(form.file_type === "url" || form.file_type === "video") ? (
          inp("File URL *", <input placeholder="https://..." value={filePreview?.data || ""} onChange={e => setFilePreview({ name: e.target.value, data: e.target.value, mime: form.file_type === "video" ? "video/mp4" : "application/pdf" })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const }} />)
        ) : inp("File *", <input ref={fileRef} type="file" accept={form.file_type === "pdf" ? ".pdf" : form.file_type === "image" ? "image/*" : "*"} onChange={handleFileChange} style={{ fontSize: 13 }} />)}
        {filePreview && !filePreview.data.startsWith("http") && (
          <p style={{ fontSize: 12, color: "#16a34a", margin: "0 0 10px" }}>✅ {filePreview.name} ready to upload</p>
        )}
        {uploadMsg && <p style={{ fontSize: 13, margin: "0 0 10px", color: uploadMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{uploadMsg}</p>}
        <button onClick={handleUpload} disabled={uploading}
          style={{ padding: "9px 20px", background: uploading ? "#9ca3af" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: uploading ? "not-allowed" : "pointer" }}>
          {uploading ? "Uploading..." : "📤 Upload Material"}
        </button>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Uploaded Materials ({materials.length})</h3>
      {isLoading ? <p style={{ color: "#9ca3af" }}>Loading...</p> : materials.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No materials uploaded yet</p></div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {materials.map((m: any) => (
            <div key={m.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 24 }}>{m.file_type === "pdf" ? "📄" : m.file_type === "image" ? "🖼" : m.file_type === "video" ? "🎬" : "🔗"}</span>
              <div style={{ flex: 1, minWidth: 150 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{m.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {m.grade === "grade7" ? "Grade 7" : m.grade === "olevel" ? "O Level" : "A Level"}
                  {m.subject && ` · ${m.subject}`} · {m.file_type.toUpperCase()}
                </p>
                {m.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{m.description}</p>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`/api/study-materials/${m.id}/data`} target="_blank" rel="noreferrer"
                  style={{ padding: "5px 12px", background: "#4f46e5", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>👁 Preview</a>
                <a href={`/api/study-materials/${m.id}/data`} download={m.file_name || m.title}
                  style={{ padding: "5px 12px", background: "#16a34a", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>⬇ Download</a>
                <button onClick={() => { if (confirm("Delete this material?")) deleteMaterial.mutate(m.id); }}
                  style={{ padding: "5px 12px", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  farmer: "#16a34a", student: "#0891b2", merchant: "#d97706",
  seller: "#7c3aed", agri_intern: "#0f766e", admin: "#4f46e5",
};

function SecurityTab() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pwInputs, setPwInputs] = useState<Record<string, string>>({});
  const [pwSuccess, setPwSuccess] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", role: "farmer", display_name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
  });

  const setPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiRequest("PATCH", `/api/admin/users/${id}/password`, { password }),
    onSuccess: (_data, { id }) => {
      setPwSuccess(s => ({ ...s, [id]: true }));
      setPwInputs(p => ({ ...p, [id]: "" }));
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setTimeout(() => setPwSuccess(s => { const n = { ...s }; delete n[id]; return n; }), 3000);
    },
    onError: (err: any, { id }) => alert(`Failed to set password for user: ${err.message || "Unknown error"}`),
  });

  const addUserMutation = useMutation({
    mutationFn: (data: typeof newUser) => apiRequest("POST", "/api/admin/users", data),
    onSuccess: () => {
      setAdding(false);
      setNewUser({ email: "", role: "farmer", display_name: "" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (err: any) => alert("Failed to create user: " + (err.message || "Unknown error")),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (err: any) => alert("Delete failed: " + (err.message || "Unknown error")),
  });

  const inp: React.CSSProperties = {
    padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6,
    fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 2px" }}>🔐 Security & Access</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Manage platform accounts and set passwords for users.</p>
        </div>
        <button onClick={() => setAdding(v => !v)} style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {adding ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Add user form */}
      {adding && (
        <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
          <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14 }}>New User Account</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <input placeholder="Email address" type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} style={{ ...inp, width: "100%" }} />
            <input placeholder="Display name (optional)" value={newUser.display_name} onChange={e => setNewUser(u => ({ ...u, display_name: e.target.value }))} style={{ ...inp, width: "100%" }} />
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} style={{ ...inp, width: "100%", background: "#fff" }}>
              {["farmer", "student", "merchant", "seller", "agri_intern"].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>Account will be created without a password. Set one below after creation.</p>
          <button onClick={() => addUserMutation.mutate(newUser)} disabled={!newUser.email || addUserMutation.isPending}
            style={{ padding: "8px 20px", background: addUserMutation.isPending ? "#9ca3af" : "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {addUserMutation.isPending ? "Creating..." : "Create Account"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Loading users...</p>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>
          <div style={{ fontSize: 40 }}>👥</div>
          <p style={{ marginTop: 12 }}>No accounts yet. Add users above.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {users.map((user: any) => {
            const isExpanded = expandedId === user.id;
            const pw = pwInputs[user.id] || "";
            const saved = !!pwSuccess[user.id];
            const roleColor = ROLE_COLORS[user.role] || "#6b7280";
            return (
              <div key={user.id} style={{ background: "#fff", border: `1px solid ${isExpanded ? "#a5b4fc" : "#e5e7eb"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ background: roleColor, color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {user.role.replace("_", " ")}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.display_name || user.email}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: user.has_password ? "#d1fae5" : "#fef3c7", color: user.has_password ? "#065f46" : "#92400e" }}>
                      {user.has_password ? "✓ Password set" : "⚠ No password"}
                    </span>
                    <button onClick={() => setExpandedId(isExpanded ? null : user.id)}
                      style={{ padding: "5px 12px", background: isExpanded ? "#f1f5f9" : "#4f46e5", color: isExpanded ? "#374151" : "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {isExpanded ? "Close" : "Set Password"}
                    </button>
                    {deleteConfirm === user.id ? (
                      <>
                        <button onClick={() => deleteUserMutation.mutate(user.id)} style={{ padding: "5px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: "5px 10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(user.id)} style={{ padding: "5px 10px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }} title="Delete user">🗑</button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 16px", background: "#fafafa" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>
                      Set a password for <strong>{user.email}</strong>. They will use this to log in.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="password"
                        value={pw}
                        onChange={e => setPwInputs(p => ({ ...p, [user.id]: e.target.value }))}
                        placeholder="New password (min. 6 chars)"
                        style={{ ...inp, flex: 1 }}
                        autoComplete="new-password"
                      />
                      <button
                        onClick={() => pw.length >= 6 && setPasswordMutation.mutate({ id: user.id, password: pw })}
                        disabled={pw.length < 6 || setPasswordMutation.isPending}
                        style={{ padding: "8px 16px", background: saved ? "#16a34a" : pw.length >= 6 ? "#4f46e5" : "#9ca3af", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                        {saved ? "✓ Saved" : setPasswordMutation.isPending ? "Saving..." : "Set Password"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ border: "1px solid #fef3c7", borderRadius: 10, padding: 16, background: "#fffbeb" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#92400e" }}>⚠️ Security Notes</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#78350f", lineHeight: 1.8 }}>
          <li>Accounts without a password cannot log in — set passwords before sharing with users</li>
          <li>Admin account identity is verified server-side — it cannot be changed from the UI</li>
          <li>Tokens expire after 7 days — users must re-login after expiry</li>
          <li>EcoCash account for payments: <strong>0783652488</strong></li>
        </ul>
      </div>
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("image-adverts");
  const [generating, setGenerating] = useState<string | null>(null);
  const isAdmin = useAdminCheck();
  const qc = useQueryClient();

  const { data: advertRequests = [], isLoading: loadingAdverts } = useQuery<AdvertRequest[]>({
    queryKey: ["/api/admin/advert-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/advert-requests"),
    enabled: isAdmin,
  });
  const { data: productRequests = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ["/api/admin/product-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/product-requests"),
    enabled: isAdmin,
  });
  const { data: internRequests = [], isLoading: loadingInterns } = useQuery<any[]>({
    queryKey: ["/api/intern-attachments"],
    queryFn: () => apiRequest("GET", "/api/intern-attachments"),
    enabled: isAdmin,
  });
  const { data: consultations = [], isLoading: loadingConsultations } = useQuery<Consultation[]>({
    queryKey: ["/api/admin/consultations"],
    queryFn: () => apiRequest("GET", "/api/admin/consultations"),
    enabled: isAdmin,
  });

  const updateAdvertStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/advert-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/advert-requests"] }),
    onError: (err: any) => alert("Update failed: " + (err?.message || "Unknown error")),
  });
  const updateProductStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/product-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/product-requests"] }),
    onError: (err: any) => alert("Update failed: " + (err?.message || "Unknown error")),
  });
  const updateInternStatus = useMutation({
    mutationFn: ({ id, status, response }: { id: string; status: string; response?: string }) =>
      apiRequest("PATCH", `/api/intern-attachments/${id}`, { status, response }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/intern-attachments"] }),
    onError: (err: any) => alert("Update failed: " + (err?.message || "Unknown error")),
  });
  const respondConsultation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiRequest("PATCH", `/api/admin/consultations/${id}`, { response, status: "responded" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/consultations"] }),
    onError: (err: any) => alert("Failed to send response: " + (err?.message || "Unknown error")),
  });

  const handleGenerate = async (requestId: string, type: "image" | "video") => {
    setGenerating(requestId);
    try {
      await apiRequest("POST", `/api/admin/generate-${type}`, { requestId });
      qc.invalidateQueries({ queryKey: ["/api/admin/advert-requests"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setGenerating(null); }
  };

  const handlePublish = async (requestId: string) => {
    try {
      await apiRequest("POST", `/api/admin/advert-requests/${requestId}/publish`, {});
      qc.invalidateQueries({ queryKey: ["/api/admin/advert-requests"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
    } catch (err: any) { alert("Publish failed: " + err.message); }
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <p style={{ fontWeight: 700, color: "#374151", marginTop: 12 }}>Admin access required</p>
          <button onClick={() => navigate("/admin-login")} style={{ marginTop: 12, padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Admin Login</button>
        </div>
      </div>
    );
  }

  const imageAdverts = advertRequests.filter(r => !r.advert_type || r.advert_type === "image" || r.generated_image_url);
  const videoAdverts = advertRequests.filter(r => r.advert_type === "video" || r.generated_video_url);
  const aiCfg = AI_CONFIG[tab] || AI_CONFIG["image-adverts"];

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
            style={{ padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? "#4f46e5" : "#6b7280", borderBottom: tab === key ? "3px solid #4f46e5" : "3px solid transparent", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, background: "#f8fafc", padding: 20 }}>
        {(tab === "image-adverts" || tab === "video-adverts") && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>
              {tab === "image-adverts" ? "🖼 Image Adverts" : "🎬 Video Adverts"} ({(tab === "image-adverts" ? imageAdverts : videoAdverts).length})
            </h2>
            {loadingAdverts ? <p style={{ color: "#9ca3af" }}>Loading...</p> :
              (tab === "image-adverts" ? imageAdverts : videoAdverts).length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No {tab === "image-adverts" ? "image" : "video"} advert requests yet</p></div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {(tab === "image-adverts" ? imageAdverts : videoAdverts).map(r => (
                    <AdvertCard key={r.id} req={r} type={tab === "image-adverts" ? "image" : "video"} generating={generating}
                      onGenImage={(id) => handleGenerate(id, "image")}
                      onGenVideo={(id) => handleGenerate(id, "video")}
                      onUpdateStatus={(id, status) => updateAdvertStatus.mutate({ id, status })}
                      onPublish={handlePublish}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {tab === "media-hub" && <MediaHubTab />}
        {tab === "subjects" && <SubjectsTab />}

        {tab === "product-requests" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Product Requests ({productRequests.length})</h2>
            {loadingProducts ? <p style={{ color: "#9ca3af" }}>Loading...</p> : productRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No product requests yet</p></div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {productRequests.map((r: any) => (
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
                          style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Accept</button>
                        <button onClick={() => updateProductStatus.mutate({ id: r.id, status: "rejected" })}
                          style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ Reject</button>
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
                        <button onClick={() => updateInternStatus.mutate({ id: r.id, status: "accepted" })}
                          style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Accept</button>
                        <button onClick={() => updateInternStatus.mutate({ id: r.id, status: "rejected" })}
                          style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ Reject</button>
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
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>Consultations ({consultations.length})</h2>
            {loadingConsultations ? <p style={{ color: "#9ca3af" }}>Loading...</p> : consultations.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No consultation requests yet</p></div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {consultations.map(c => (
                  <ConsultationCard key={c.id} c={c} onRespond={(id, response) => respondConsultation.mutate({ id, response })} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "revenue" && <RevenueTab />}
        {tab === "study-materials" && <StudyMaterialsTab />}
        {tab === "security" && <SecurityTab />}
      </div>

      <AiChatPanel
        key={tab}
        section={tab}
        endpoint="/api/ai/hybrid"
        placeholder={aiCfg.placeholder}
        greeting={aiCfg.greeting}
        headerLabel={aiCfg.headerLabel}
      />
    </div>
  );
}

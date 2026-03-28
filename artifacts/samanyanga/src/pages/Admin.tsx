import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AiChatPanel from "@/components/AiChatPanel";

const TABS = [
  { key: "image-adverts", label: "🖼 Image Adverts" },
  { key: "video-adverts", label: "🎬 Video Adverts" },
  { key: "product-requests", label: "🛒 Products" },
  { key: "intern-requests", label: "🎓 Interns" },
  { key: "consultations", label: "💬 Consultations" },
  { key: "revenue", label: "💰 Revenue" },
  { key: "study-materials", label: "📚 Study Materials" },
  { key: "security", label: "🔐 Security" },
];

const AI_CONFIG: Record<string, { placeholder: string; greeting: string; headerLabel: string }> = {
  "image-adverts": { placeholder: "Ask about image advert management...", greeting: "Hi! I can help you manage image advert requests — approvals, image generation, and publishing.", headerLabel: "Image Advert AI" },
  "video-adverts": { placeholder: "Ask about video advert management...", greeting: "Hi! I can help you manage video advert requests — video generation, approvals, and publishing.", headerLabel: "Video Advert AI" },
  "product-requests": { placeholder: "Ask about product requests...", greeting: "Hi! I can assist with marketplace product requests — accepting, rejecting, and tracking buyer inquiries.", headerLabel: "Marketplace AI" },
  "intern-requests": { placeholder: "Ask about intern management...", greeting: "Hi! I can help manage intern attachment requests — reviewing applications and responding to students.", headerLabel: "Intern AI" },
  "consultations": { placeholder: "Ask about consultations...", greeting: "Hi! I can help with consultation management — reviewing requests, responding to users, and tracking paid consultations.", headerLabel: "Consultation AI" },
  "revenue": { placeholder: "Ask about revenue and payments...", greeting: "Hi! I can help you understand revenue, track EcoCash payments (0783652488), process transactions, and generate payment reports.", headerLabel: "Revenue AI" },
  "study-materials": { placeholder: "Ask about study materials...", greeting: "Hi! I can help you organise and upload study materials for students — PDFs, images, and video links by grade and subject.", headerLabel: "Study Materials AI" },
  "security": { placeholder: "Ask about security and accounts...", greeting: "Hi! I can help you manage demo accounts, review user access, and advise on platform security practices.", headerLabel: "Security AI" },
};

function useAdminCheck() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "admin" || payload.email === "admin@demo.com";
  } catch { return false; }
}

interface AdvertRequest {
  id: string; name: string; email: string; phone?: string; message: string;
  type: string; status: string; payment_status: string; created_at: string;
  generated_image_url?: string; generated_video_url?: string; advert_type?: string;
}
interface ProductRequest {
  id: string; product_id: string; product_name: string; product_price: number;
  location: string; buyer_name: string; buyer_phone: string; message?: string;
  status: string; created_at: string;
}
interface Consultation {
  id: string; name: string; email: string; phone?: string; type: string;
  message: string; status: string; response?: string; payment_status: string;
  payment_ref?: string; created_at: string;
}
interface StudyMaterial {
  id: string; title: string; description?: string; grade: string; subject?: string;
  file_type: string; file_name?: string; mime_type?: string; uploaded_at: string;
}

function badge(s: string) {
  const c = s === "pending" ? "#92400e" : ["approved","paid","responded","accepted"].includes(s) ? "#065f46" : s === "priority" ? "#1e40af" : "#6b7280";
  const bg = s === "pending" ? "#fef3c7" : ["approved","paid","responded","accepted"].includes(s) ? "#d1fae5" : s === "priority" ? "#dbeafe" : "#f3f4f6";
  return <span style={{ background: bg, color: c, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize" as const }}>{s}</span>;
}

function AdvertCard({ req, type, onGenImage, onGenVideo, onUpdateStatus, generating }: {
  req: AdvertRequest; type: "image" | "video";
  onGenImage: (id: string) => void; onGenVideo: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void; generating: string | null;
}) {
  const mediaUrl = type === "image" ? req.generated_image_url : req.generated_video_url;
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.target = "_blank"; a.click();
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
          {type === "image" ? (
            <img src={mediaUrl} alt="Generated ad" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
          ) : (
            <video src={mediaUrl} controls style={{ width: "100%", maxHeight: 200 }} />
          )}
          <div style={{ display: "flex", gap: 8, padding: "8px 12px", background: "#f0fdf4" }}>
            <a href={mediaUrl} target="_blank" rel="noreferrer" style={{ color: "#16a34a", fontSize: 12, fontWeight: 600 }}>👁 Preview</a>
            <button onClick={() => handleDownload(mediaUrl, `ad-${req.id}.${type === "image" ? "jpg" : "mp4"}`)}
              style={{ background: "none", border: "none", color: "#4f46e5", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
              ⬇ Download
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {type === "image" ? (
          <button onClick={() => onGenImage(req.id)} disabled={generating === req.id}
            style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {generating === req.id ? "Generating..." : "🖼 Generate Image"}
          </button>
        ) : (
          <button onClick={() => onGenVideo(req.id)} disabled={generating === req.id}
            style={{ padding: "7px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {generating === req.id ? "Generating..." : "🎬 Generate Video"}
          </button>
        )}
        {req.status === "pending" && (
          <>
            <button onClick={() => onUpdateStatus(req.id, "approved")}
              style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
            <button onClick={() => onUpdateStatus(req.id, "rejected")}
              style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ Reject</button>
          </>
        )}
      </div>
    </div>
  );
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
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
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
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>Also accepts: OneMoney, Telecash, Bank Transfer (reference payment ID)</p>
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
                    style={{ padding: "4px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    ✓ Mark Paid
                  </button>
                )}
                {t.payment_status === "paid" && (
                  <button onClick={() => updatePayment.mutate({ source: t.source, id: t.id, status: "refunded" })}
                    style={{ padding: "4px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    ↩ Refund
                  </button>
                )}
                {t.payment_status === "refunded" && (
                  <button onClick={() => updatePayment.mutate({ source: t.source, id: t.id, status: "pending" })}
                    style={{ padding: "4px 10px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    ↺ Reset
                  </button>
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

  const { data: materials = [], isLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/admin/study-materials"],
    queryFn: () => apiRequest("GET", "/api/admin/study-materials"),
  });

  const deleteMaterial = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/study-materials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/study-materials"] }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview({ name: file.name, data: reader.result as string, mime: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!form.title || !form.grade) { setUploadMsg("Title and grade are required."); return; }
    if (!filePreview && form.file_type !== "url") { setUploadMsg("Please select a file."); return; }
    setUploading(true); setUploadMsg("");
    try {
      await apiRequest("POST", "/api/admin/study-materials", {
        ...form,
        file_data: filePreview?.data || null,
        file_name: filePreview?.name || null,
        mime_type: filePreview?.mime || null,
      });
      setUploadMsg("✅ Material uploaded successfully!");
      setForm({ title: "", description: "", grade: "olevel", subject: "", file_type: "pdf" });
      setFilePreview(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["/api/admin/study-materials"] });
    } catch (err: any) {
      setUploadMsg("❌ Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const inp = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );

  const sel = (val: string, onChange: (v: string) => void, opts: [string, string][]) => (
    <select value={val} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff" }}>
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
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />)}
          {inp("Grade Level *", sel(form.grade, v => setForm(f => ({ ...f, grade: v })), [["grade7","Grade 7"],["olevel","O Level"],["alevel","A Level"]]))}
          {inp("Subject", <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />)}
          {inp("File Type", sel(form.file_type, v => setForm(f => ({ ...f, file_type: v })), [["pdf","PDF Document"],["image","Image"],["video","Video (URL)"],["url","External URL"]]))}
        </div>
        {inp("Description", <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..."
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />)}
        {(form.file_type === "url" || form.file_type === "video") ? (
          inp("File URL *", <input placeholder="https://..." value={filePreview?.data || ""} onChange={e => setFilePreview({ name: e.target.value, data: e.target.value, mime: form.file_type === "video" ? "video/mp4" : "application/pdf" })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />)
        ) : (
          inp("File *", <input ref={fileRef} type="file" accept={form.file_type === "pdf" ? ".pdf" : form.file_type === "image" ? "image/*" : "*"} onChange={handleFileChange}
            style={{ fontSize: 13 }} />)
        )}
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
          {materials.map(m => (
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
                  style={{ padding: "5px 12px", background: "#4f46e5", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  👁 Preview
                </a>
                <a href={`/api/study-materials/${m.id}/data`} download={m.file_name || m.title}
                  style={{ padding: "5px 12px", background: "#16a34a", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  ⬇ Download
                </a>
                <button onClick={() => { if (confirm("Delete this material?")) deleteMaterial.mutate(m.id); }}
                  style={{ padding: "5px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const DEMO_ACCOUNTS = [
    { email: "admin@demo.com", password: "demo123", role: "Admin", description: "Full dashboard access — manage adverts, products, interns, consultations, revenue, study materials" },
    { email: "farmer@demo.com", password: "demo123", role: "Farmer", description: "Access to AgriMarketplace, product listings, intern management, and AI farming assistant" },
    { email: "student@demo.com", password: "demo123", role: "Student", description: "Access to Study Companion, study materials, AI tutor, and consultations" },
    { email: "buyer@demo.com", password: "demo123", role: "Buyer/Merchant", description: "Access to marketplace, product browsing, and buyer AI assistant" },
    { email: "seller@demo.com", password: "demo123", role: "Seller", description: "Access to product listings, seller tools, and seller AI assistant" },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>🔐 Security & Demo Accounts</h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>Demo accounts for testing and onboarding. Share these credentials with testers — never use in production without changing passwords.</p>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {DEMO_ACCOUNTS.map(acc => (
          <div key={acc.email} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ background: acc.role === "Admin" ? "#4f46e5" : acc.role === "Farmer" ? "#16a34a" : acc.role === "Student" ? "#0891b2" : "#d97706", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{acc.role}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>EMAIL</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{acc.email}</p>
                  <button onClick={() => copyToClipboard(acc.email)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }} title="Copy">📋</button>
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>PASSWORD</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{acc.password}</p>
                  <button onClick={() => copyToClipboard(acc.password)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }} title="Copy">📋</button>
                </div>
              </div>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>{acc.description}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #fef3c7", borderRadius: 10, padding: 16, background: "#fffbeb" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#92400e" }}>⚠️ Security Notes</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#78350f", lineHeight: 1.8 }}>
          <li>All demo accounts use <strong>demo123</strong> as password — change before going live</li>
          <li>Admin access is tied to the <code>admin@demo.com</code> email and <code>admin</code> role</li>
          <li>Tokens expire after 7 days — users must re-login after expiry</li>
          <li>EcoCash account for payments: <strong>0783652488</strong></li>
          <li>JWT secret is stored server-side — rotate it when switching to production</li>
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

  const { data: productRequests = [], isLoading: loadingProducts } = useQuery<ProductRequest[]>({
    queryKey: ["/api/admin/product-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/product-requests"),
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

  const { data: internRequests = [], isLoading: loadingInterns } = useQuery<any[]>({
    queryKey: ["/api/intern-attachments"],
    queryFn: () => apiRequest("GET", "/api/intern-attachments"),
    enabled: isAdmin,
  });

  const updateInternStatus = useMutation({
    mutationFn: ({ id, status, response }: { id: string; status: string; response?: string }) =>
      apiRequest("PATCH", `/api/intern-attachments/${id}`, { status, response }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/intern-attachments"] }),
    onError: (err: any) => alert("Update failed: " + (err?.message || "Unknown error")),
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
    onError: (err: any) => alert("Failed to send response: " + (err?.message || "Unknown error")),
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
              <div style={{ textAlign: "center", padding: 40 }}><p style={{ color: "#9ca3af" }}>No product requests yet</p></div>
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

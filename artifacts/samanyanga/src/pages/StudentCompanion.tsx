import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { studentAIHybrid } from "@/lib/aiEngine";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { saveMaterial, removeMaterial, isSavedSync, getSavedMaterials, getCachedUrl, type SavedMeta } from "@/lib/offlineStorage";
import { useOffline } from "@/hooks/useOffline";

const LEVELS = [
  { key: "grade7", label: "Grade 7" },
  { key: "olevel", label: "O Level" },
  { key: "alevel", label: "A Level" },
];

const SUBJECTS_FALLBACK: Record<string, string[]> = {
  grade7: ["Mathematics", "English Language", "Science", "Social Studies", "Shona", "Ndebele"],
  olevel: ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Commerce", "Accounts", "Computer Science"],
  alevel: ["Pure Mathematics", "Applied Mathematics", "Biology", "Chemistry", "Physics", "Economics", "History", "English Literature", "Computer Science"],
};

function useSubjects() {
  const [subjects, setSubjects] = useState<Record<string, string[]>>(SUBJECTS_FALLBACK);
  useEffect(() => {
    fetch("/api/subjects")
      .then(r => r.ok ? r.json() : null)
      .then((data: { name: string; grade: string }[] | null) => {
        if (!data || !Array.isArray(data)) return;
        const grouped: Record<string, string[]> = { grade7: [], olevel: [], alevel: [] };
        data.forEach(s => { if (grouped[s.grade]) grouped[s.grade].push(s.name); });
        const hasData = Object.values(grouped).some(arr => arr.length > 0);
        if (hasData) setSubjects(grouped);
      })
      .catch(() => { /* keep fallback */ });
  }, []);
  return subjects;
}

interface Message { role: "user" | "ai"; text: string; }
interface StudyMaterial {
  id: string; title: string; description?: string; grade: string; subject?: string;
  file_type: string; file_name?: string; mime_type?: string; uploaded_at: string;
}

function MaterialViewer({ m }: { m: StudyMaterial }) {
  const isOffline = useOffline();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(() => isSavedSync(m.id));
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const apiUrl = `/api/study-materials/${m.id}/data`;
  const icon = m.file_type === "pdf" ? "📄" : m.file_type === "image" ? "🖼️" : m.file_type === "video" ? "🎬" : "🔗";

  // When offline and viewing, resolve from cache
  useEffect(() => {
    if (open && isOffline && saved) {
      getCachedUrl(apiUrl).then(url => { if (url) setCachedSrc(url); });
    } else {
      setCachedSrc(null);
    }
  }, [open, isOffline, saved, apiUrl]);

  const handleSave = async () => {
    setSaving(true);
    setProgress(0);
    try {
      await saveMaterial(
        { id: m.id, title: m.title, grade: m.grade, subject: m.subject, file_type: m.file_type, file_name: m.file_name },
        apiUrl,
        setProgress
      );
      setSaved(true);
    } catch (e: any) {
      alert("Could not save: " + e.message);
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    await removeMaterial(m.id, apiUrl);
    setSaved(false);
    setCachedSrc(null);
  };

  const viewSrc = cachedSrc || apiUrl;

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{m.title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
            {m.grade === "grade7" ? "Grade 7" : m.grade === "olevel" ? "O Level" : "A Level"}
            {m.subject && ` · ${m.subject}`}
          </p>
          {m.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{m.description}</p>}
          {saved && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", borderRadius: 20, padding: "2px 8px" }}>
              ✅ Saved offline
            </span>
          )}
          {isOffline && !saved && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fee2e2", borderRadius: 20, padding: "2px 8px" }}>
              📵 Not saved — unavailable offline
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setOpen(o => !o)}
            style={{ padding: "6px 12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {open ? "Hide" : "👁 View"}
          </button>
          {m.file_type !== "url" && !isOffline && (
            <a href={apiUrl} download={m.file_name || m.title}
              style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              ⬇ Download
            </a>
          )}
          {m.file_type !== "url" && !saved && !saving && !isOffline && (
            <button onClick={handleSave}
              style={{ padding: "6px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              💾 Save offline
            </button>
          )}
          {saving && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fef3c7", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              <div style={{ width: 60, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#f59e0b", transition: "width 0.2s" }} />
              </div>
              <span>{progress}%</span>
            </div>
          )}
          {saved && (
            <button onClick={handleRemove}
              style={{ padding: "6px 12px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              🗑 Remove
            </button>
          )}
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          {isOffline && !cachedSrc && (
            <div style={{ padding: 20, textAlign: "center", color: "#dc2626", fontSize: 13 }}>
              📵 You're offline. Save this material while online to view it offline.
            </div>
          )}
          {(!isOffline || cachedSrc) && (
            <>
              {m.file_type === "image" && (
                <img src={viewSrc} alt={m.title} style={{ width: "100%", maxHeight: 400, objectFit: "contain", display: "block", background: "#f8fafc" }} />
              )}
              {m.file_type === "video" && (
                <video src={viewSrc} controls style={{ width: "100%", maxHeight: 360 }} />
              )}
              {m.file_type === "pdf" && (
                <iframe src={`${viewSrc}#toolbar=1`} title={m.title} style={{ width: "100%", height: 500, border: "none" }} />
              )}
              {m.file_type === "url" && (
                <a href={apiUrl} target="_blank" rel="noreferrer"
                  style={{ display: "block", padding: 16, color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
                  🔗 Open external link
                </a>
              )}
            </>
          )}
          {cachedSrc && (
            <div style={{ padding: "6px 12px", background: "#dcfce7", fontSize: 11, color: "#166534", fontWeight: 600 }}>
              ✅ Viewing saved offline copy
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OfflineMaterialsList() {
  const [saved, setSaved] = useState<SavedMeta[]>(() => getSavedMaterials());

  const handleRemove = async (item: SavedMeta) => {
    await removeMaterial(item.id, `/api/study-materials/${item.id}/data`);
    setSaved(getSavedMaterials());
  };

  if (saved.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ fontSize: 40 }}>💾</p>
        <p style={{ color: "#6b7280", fontWeight: 600 }}>No materials saved offline yet</p>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Go to Study Materials, open a file and tap "Save offline" while you have internet.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 10 }}>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 8px" }}>
        {saved.length} material{saved.length !== 1 ? "s" : ""} saved — available even without internet
      </p>
      {saved.map(item => {
        const icon = item.file_type === "pdf" ? "📄" : item.file_type === "image" ? "🖼️" : item.file_type === "video" ? "🎬" : "🔗";
        const kb = item.size ? (item.size / 1024).toFixed(0) : null;
        return (
          <div key={item.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{item.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                {item.grade === "grade7" ? "Grade 7" : item.grade === "olevel" ? "O Level" : "A Level"}
                {item.subject && ` · ${item.subject}`}
                {kb && ` · ${Number(kb) > 999 ? `${(Number(kb)/1024).toFixed(1)} MB` : `${kb} KB`}`}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", borderRadius: 20, padding: "3px 10px", alignSelf: "center" }}>
                ✅ Offline
              </span>
              <button onClick={() => handleRemove(item)}
                style={{ padding: "5px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudentCompanion() {
  const auth = useAuthGuard();
  const subjects = useSubjects();
  const [, navigate] = useLocation();
  const [mainTab, setMainTab] = useState<"chat" | "materials" | "offline">("chat");
  const [level, setLevel] = useState("olevel");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm your Study Companion. Select your level and subject, then ask me anything. I can help with explanations, past paper questions, or study tips." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [matLevel, setMatLevel] = useState("olevel");
  const [matSubject, setMatSubject] = useState("");
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [matLoading, setMatLoading] = useState(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (mainTab === "materials") {
      fetchMaterials();
    }
  }, [mainTab, matLevel, matSubject]);

  const fetchMaterials = async () => {
    setMatLoading(true);
    try {
      const params = new URLSearchParams({ grade: matLevel });
      if (matSubject) params.append("subject", matSubject);
      const res = await fetch(`/api/study-materials?${params}`);
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch {
      setMaterials([]);
    } finally {
      setMatLoading(false);
    }
  };

  if (!auth) return null;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const context = `${level} ${subject ? `- ${subject}` : ""}`;
      const reply = await studentAIHybrid(userMsg, context);
      setMessages(m => [...m, { role: "ai", text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadChat = () => {
    const text = messages.map(m => `${m.role === "user" ? "You" : "AI"}: ${m.text}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `study-session-${level}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>📚</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800 }}>Study Companion</h1>
            <p style={{ color: "#c7d2fe", margin: 0, fontSize: 12 }}>AI-powered study assistant</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {mainTab === "chat" && (
            <button onClick={downloadChat} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>⬇ Download</button>
          )}
          <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Logout</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", overflowX: "auto" }}>
        {([["chat", "💬 AI Tutor"], ["materials", "📁 Study Materials"], ["offline", "💾 Offline"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMainTab(key as typeof mainTab)}
            style={{ padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: mainTab === key ? 700 : 500, color: mainTab === key ? "#4f46e5" : "#6b7280", borderBottom: mainTab === key ? "3px solid #4f46e5" : "3px solid transparent", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {mainTab === "chat" && (
        <>
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {LEVELS.map(l => (
                <button key={l.key} onClick={() => { setLevel(l.key); setSubject(""); }}
                  style={{ padding: "5px 14px", border: "1px solid", borderColor: level === l.key ? "#4f46e5" : "#d1d5db", background: level === l.key ? "#4f46e5" : "#fff", color: level === l.key ? "#fff" : "#374151", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {l.label}
                </button>
              ))}
            </div>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}>
              <option value="">All Subjects</option>
              {subjects[level]?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.role === "user" ? "#4f46e5" : "#fff", color: m.role === "user" ? "#fff" : "#1f2937", fontSize: 14, lineHeight: 1.6, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: m.role === "ai" ? "1px solid #e5e7eb" : "none" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", background: "#fff", borderRadius: "12px 12px 12px 2px", border: "1px solid #e5e7eb", fontSize: 14, color: "#9ca3af" }}>Thinking...</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Ask about ${subject || (level === "grade7" ? "Grade 7" : level === "olevel" ? "O Level" : "A Level")} topics...`}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" }} />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ padding: "10px 18px", background: loading ? "#9ca3af" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
              Send
            </button>
          </div>
        </>
      )}

      {mainTab === "materials" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {LEVELS.map(l => (
                  <button key={l.key} onClick={() => { setMatLevel(l.key); setMatSubject(""); }}
                    style={{ padding: "5px 14px", border: "1px solid", borderColor: matLevel === l.key ? "#4f46e5" : "#d1d5db", background: matLevel === l.key ? "#4f46e5" : "#fff", color: matLevel === l.key ? "#fff" : "#374151", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {l.label}
                  </button>
                ))}
              </div>
              <select value={matSubject} onChange={e => setMatSubject(e.target.value)}
                style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                <option value="">All Subjects</option>
                {subjects[matLevel]?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={fetchMaterials} style={{ padding: "5px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>↺ Refresh</button>
            </div>

            {matLoading ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Loading materials...</p>
            ) : materials.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <p style={{ fontSize: 40 }}>📂</p>
                <p style={{ color: "#6b7280", fontWeight: 600 }}>No materials found for this selection</p>
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Materials are uploaded by your teacher/admin. Check back later or try a different grade or subject.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {materials.map(m => <MaterialViewer key={m.id} m={m} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === "offline" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <OfflineMaterialsList />
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { studentAIHybrid } from "@/lib/aiEngine";
import { useAuthGuard } from "@/lib/useAuthGuard";

const LEVELS = [
  { key: "grade7", label: "Grade 7" },
  { key: "olevel", label: "O Level" },
  { key: "alevel", label: "A Level" },
];

const SUBJECTS: Record<string, string[]> = {
  grade7: ["Mathematics", "English", "Science", "Social Studies", "Shona", "Ndebele"],
  olevel: ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Commerce", "Accounts"],
  alevel: ["Pure Mathematics", "Applied Mathematics", "Biology", "Chemistry", "Physics", "Economics", "History", "English Literature"],
};

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function StudentCompanion() {
  const auth = useAuthGuard();
  const [, navigate] = useLocation();
  const [level, setLevel] = useState("olevel");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm your Study Companion. Select your level and subject, then ask me anything. I can help with explanations, past paper questions, or study tips." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    a.href = url;
    a.download = `study-session-${level}-${Date.now()}.txt`;
    a.click();
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
          <button
            onClick={downloadChat}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
          >
            ⬇ Download
          </button>
          <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Logout</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {LEVELS.map(l => (
            <button
              key={l.key}
              onClick={() => { setLevel(l.key); setSubject(""); }}
              style={{ padding: "5px 14px", border: "1px solid", borderColor: level === l.key ? "#4f46e5" : "#d1d5db", background: level === l.key ? "#4f46e5" : "#fff", color: level === l.key ? "#fff" : "#374151", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}
        >
          <option value="">All Subjects</option>
          {SUBJECTS[level]?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "78%",
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: m.role === "user" ? "#4f46e5" : "#fff",
              color: m.role === "user" ? "#fff" : "#1f2937",
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              border: m.role === "ai" ? "1px solid #e5e7eb" : "none",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", background: "#fff", borderRadius: "12px 12px 12px 2px", border: "1px solid #e5e7eb", fontSize: 14, color: "#9ca3af" }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={`Ask about ${subject || (level === "grade7" ? "Grade 7" : level === "olevel" ? "O Level" : "A Level")} topics...`}
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ padding: "10px 18px", background: loading ? "#9ca3af" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

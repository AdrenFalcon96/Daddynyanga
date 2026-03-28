import { useState, useRef, useEffect } from "react";
import { agriAIHybrid } from "@/lib/aiEngine";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface Props {
  context?: string;
  endpoint?: string;
  section?: string;
  placeholder?: string;
  greeting?: string;
  headerLabel?: string;
}

export default function AiChatPanel({
  context,
  endpoint,
  section,
  placeholder = "Ask about farming...",
  greeting = "Hello! I'm your AgriAI assistant. Ask me about crops, livestock, soil, prices, or farming tips.",
  headerLabel = "AgriAI Chat",
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      let reply: string;
      if (endpoint) {
        const token = localStorage.getItem("token");
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: text, context, section }),
        });
        const data = await res.json();
        reply = data.reply || "I'm here to help. Please ask your question.";
      } else {
        reply = await agriAIHybrid(text);
      }
      setMessages(m => [...m, { role: "ai", text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000, fontFamily: "system-ui, sans-serif" }}>
      {open && (
        <div style={{
          width: 320, height: 400, background: "#fff", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column",
          border: "1px solid #e5e7eb", marginBottom: 8,
        }}>
          <div style={{ background: "linear-gradient(135deg,#14532d,#166534)", padding: "10px 14px", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>🌾</span>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{headerLabel}</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#86efac", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "7px 11px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.role === "user" ? "#16a34a" : "#f3f4f6",
                  color: m.role === "user" ? "#fff" : "#111827",
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "7px 11px", background: "#f3f4f6", borderRadius: "12px 12px 12px 2px", fontSize: 13, color: "#9ca3af" }}>Thinking...</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "8px 10px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 6 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder={placeholder}
              style={{ flex: 1, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none" }}
            />
            <button
              onClick={send}
              disabled={loading}
              style={{ padding: "7px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#14532d,#16a34a)",
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(22,163,74,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          marginLeft: "auto",
        }}
        title="AgriAI Chat"
      >
        🌾
      </button>
    </div>
  );
}

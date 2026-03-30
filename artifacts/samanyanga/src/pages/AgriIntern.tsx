import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthGuard } from "@/lib/useAuthGuard";
import AiChatPanel from "@/components/AiChatPanel";
import { useOffline } from "@/hooks/useOffline";
import { addToQueue } from "@/lib/offlineQueue";

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

const TABS = [
  { key: "apply", label: "📝 Apply for Attachment" },
  { key: "my-applications", label: "📋 My Applications" },
];

function ApplyForm() {
  const qc = useQueryClient();
  const isOffline = useOffline();
  const [queued, setQueued] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    student_email: "",
    institution: "",
    program: "",
    year: "1st",
    message: "",
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/intern-attachments", data),
    onSuccess: () => {
      alert("Application submitted! Farmers will review and respond.");
      qc.invalidateQueries({ queryKey: ["/api/intern-attachments"] });
      setForm({ student_name: "", student_email: "", institution: "", program: "", year: "1st", message: "" });
    },
    onError: () => {
      // Network failure — save to queue so it's sent when back online
      addToQueue({
        endpoint: "/api/intern-attachments",
        method: "POST",
        body: form as Record<string, unknown>,
        label: `Intern application from ${form.student_name}`,
      });
      setQueued(true);
      setForm({ student_name: "", student_email: "", institution: "", program: "", year: "1st", message: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      addToQueue({
        endpoint: "/api/intern-attachments",
        method: "POST",
        body: form as Record<string, unknown>,
        label: `Intern application from ${form.student_name}`,
      });
      setQueued(true);
      setForm({ student_name: "", student_email: "", institution: "", program: "", year: "1st", message: "" });
      return;
    }
    submitMutation.mutate(form);
  };

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={key !== "message"}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
      />
    </div>
  );

  if (queued) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "40px 16px" }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>📤</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Application Saved!</h3>
        <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>Your application has been saved locally.</p>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1d4ed8" }}>
          📶 You're offline. Your application will be submitted automatically once you're back online.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#14532d", fontWeight: 600 }}>🎓 Industrial Attachment Programme</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#166534" }}>Submit your application to connect with farmers and agricultural institutions offering attachment opportunities in Zimbabwe.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {field("Full Name", "student_name")}
        {field("Email Address", "student_email", "email")}
        {field("Institution / University", "institution")}
        {field("Programme / Course of Study", "program")}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Year of Study</label>
          <select
            value={form.year}
            onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box" }}
          >
            {["1st", "2nd", "3rd", "4th", "5th"].map(y => <option key={y} value={y}>{y} Year</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Cover Message (Optional)</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={3}
            placeholder="Briefly describe your interests and what you hope to learn..."
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          style={{ width: "100%", padding: "12px", background: submitMutation.isPending ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

function MyApplications() {
  const token = localStorage.getItem("token");
  let email = "";
  try {
    if (token) {
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      email = payload.email || "";
    }
  } catch {}

  const { data: requests = [], isLoading } = useQuery<InternRequest[]>({
    queryKey: ["/api/intern-attachments", email],
    queryFn: () => apiRequest("GET", email ? `/api/intern-attachments?email=${encodeURIComponent(email)}` : "/api/intern-attachments"),
  });

  if (isLoading) return <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Loading...</p>;

  if (requests.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 48 }}>📭</div>
        <p style={{ color: "#374151", fontWeight: 700, fontSize: 16, marginTop: 12 }}>No applications yet</p>
        <p style={{ color: "#6b7280", fontSize: 13 }}>Submit your first application to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "grid", gap: 14 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>🏫 {r.institution}</p>
                <p style={{ margin: "2px 0 6px", fontSize: 13, color: "#374151" }}>📚 {r.program} · Year {r.year}</p>
                {r.message && <p style={{ margin: "4px 0", fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>"{r.message}"</p>}
                <span style={{
                  background: r.status === "accepted" ? "#d1fae5" : r.status === "rejected" ? "#fee2e2" : "#fef3c7",
                  color: r.status === "accepted" ? "#065f46" : r.status === "rejected" ? "#991b1b" : "#92400e",
                  padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: "capitalize", display: "inline-block", marginTop: 6,
                }}>
                  {r.status === "accepted" ? "✓ Accepted" : r.status === "rejected" ? "✕ Declined" : "⏳ Pending"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            {r.response && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: r.status === "accepted" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${r.status === "accepted" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: r.status === "accepted" ? "#166534" : "#991b1b", marginBottom: 4 }}>Response from farmer/institution:</p>
                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{r.response}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgriIntern() {
  const auth = useAuthGuard();
  const [tab, setTab] = useState("apply");
  const [, navigate] = useLocation();
  if (!auth) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#3730a3)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>Agri Intern Hub</h1>
            <p style={{ color: "#c7d2fe", margin: 0, fontSize: 12 }}>Industrial Attachment · Career Development</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Logout</button>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? "#4338ca" : "#6b7280", borderBottom: tab === key ? "3px solid #4338ca" : "3px solid transparent" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, background: "#f8fafc", padding: 24, overflowY: "auto" }}>
        {tab === "apply" && <ApplyForm />}
        {tab === "my-applications" && <MyApplications />}
      </div>

      <AiChatPanel
        section="intern"
        endpoint="/api/ai/hybrid"
        placeholder="Ask about your attachment, placement, or agri-career..."
        greeting="Hello! I'm your AgriAI assistant. I can help with your agricultural attachment application, farm placement procedures, and career advice."
        headerLabel="AgriAI — Intern"
      />
    </div>
  );
}

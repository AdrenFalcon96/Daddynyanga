import { useState } from "react";
import { useLocation } from "wouter";
import AiChatPanel from "@/components/AiChatPanel";
import { useOffline } from "@/hooks/useOffline";
import { addToQueue } from "@/lib/offlineQueue";
import { API_BASE } from "@/lib/queryClient";

const TYPES = [
  { key: "student", label: "🎓 Student", desc: "Academic and study consultation", free: true },
  { key: "farmer", label: "🌽 Farmer", desc: "Crop, livestock and farming advice", free: true },
  { key: "buyer", label: "🛒 Buyer", desc: "Marketplace and purchasing guidance", free: true },
  { key: "seller", label: "🏪 Seller", desc: "Selling, pricing and listings help", free: true },
  { key: "intern", label: "🌿 Intern", desc: "Agricultural attachment guidance", free: true },
  { key: "agronomic", label: "🔬 Agronomic", desc: "Professional agronomic consultation", free: false, price: "$5 via EcoCash" },
];

type Step = "type" | "form" | "payment" | "success";

export default function Consultation() {
  const [, navigate] = useLocation();
  const isOffline = useOffline();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("type");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultationId, setConsultationId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentConfirming, setPaymentConfirming] = useState(false);
  const [wasQueued, setWasQueued] = useState(false);

  const selectedTypeObj = TYPES.find(t => t.key === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setLoading(true);

    // If offline and it's a free consultation, queue it for later delivery
    if (isOffline && selectedTypeObj?.free) {
      addToQueue({
        endpoint: `${API_BASE}/api/consultations`,
        method: "POST",
        body: { name, email, phone, type: selectedType, message },
        label: `${selectedTypeObj.label} consultation from ${name}`,
      });
      setWasQueued(true);
      setStep("success");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, type: selectedType, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setConsultationId(data.consultation.id);
      setPaymentRef(data.paymentRef || "");
      if (selectedTypeObj?.free) {
        setStep("success");
      } else {
        setStep("payment");
      }
    } catch (err: any) {
      // Network failure on a free consultation — queue for retry
      if (selectedTypeObj?.free) {
        addToQueue({
          endpoint: `${API_BASE}/api/consultations`,
          method: "POST",
          body: { name, email, phone, type: selectedType, message },
          label: `${selectedTypeObj.label} consultation from ${name}`,
        });
        setWasQueued(true);
        setStep("success");
      } else {
        alert("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentConfirming(true);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");
      setStep("success");
    } catch (err: any) {
      alert("Payment confirmation failed: " + err.message);
    } finally {
      setPaymentConfirming(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    marginTop: 4,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 50%, #1e4d2e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <h2 style={{ margin: "6px 0 4px", fontSize: 22, fontWeight: 800, color: "#111" }}>Consultation</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Get expert guidance from our team</p>
          </div>

          {step === "type" && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Select your consultation type:</p>
              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                {TYPES.map(t => (
                  <button key={t.key} onClick={() => setSelectedType(t.key)}
                    style={{
                      padding: "12px 16px",
                      border: selectedType === t.key ? "2px solid #16a34a" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: selectedType === t.key ? "#f0fdf4" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "left",
                    }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111" }}>{t.label}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{t.desc}</p>
                    </div>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: t.free ? "#d1fae5" : "#fef3c7",
                      color: t.free ? "#065f46" : "#92400e",
                    }}>
                      {t.free ? "FREE" : t.price}
                    </span>
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedType}
                onClick={() => setStep("form")}
                style={{ width: "100%", padding: "12px", background: selectedType ? "#16a34a" : "#9ca3af", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: selectedType ? "pointer" : "not-allowed" }}>
                Continue →
              </button>
            </>
          )}

          {step === "form" && (
            <>
              <div style={{ marginBottom: 14, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#166534" }}>
                {selectedTypeObj?.label} — {selectedTypeObj?.free ? "Free consultation" : `Paid consultation (${selectedTypeObj?.price})`}
                <button onClick={() => setStep("type")} style={{ marginLeft: 10, background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Change</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Full Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email *</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Phone (optional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07x xxx xxxx" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Your Question / Message *</label>
                  <textarea
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe what you need help with..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: "100%", padding: "12px", background: loading ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Submitting..." : selectedTypeObj?.free ? "Submit Request" : "Submit & Pay"}
                </button>
              </form>
            </>
          )}

          {step === "payment" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#111" }}>Complete Payment</h3>
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>
                Your agronomic consultation request has been received. Please complete the payment to activate it.
              </p>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 20, marginBottom: 20, textAlign: "left" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#065f46" }}>EcoCash Payment Details</p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>📱 <strong>Send to:</strong> 0783652488</p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>💰 <strong>Amount:</strong> $5.00 USD</p>
                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>🔖 <strong>Reference:</strong> <code style={{ background: "#d1fae5", padding: "1px 6px", borderRadius: 4 }}>{paymentRef}</code></p>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>After sending payment, click the button below to confirm.</p>
              <button onClick={handleConfirmPayment} disabled={paymentConfirming}
                style={{ width: "100%", padding: "12px", background: paymentConfirming ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: paymentConfirming ? "not-allowed" : "pointer", marginBottom: 10 }}>
                {paymentConfirming ? "Confirming..." : "I've Paid — Confirm"}
              </button>
              <button onClick={() => setStep("success")} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 12, cursor: "pointer" }}>
                Skip for now (unconfirmed)
              </button>
            </div>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>{wasQueued ? "📤" : "✅"}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
                {wasQueued ? "Request Saved!" : "Request Submitted!"}
              </h3>
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>
                Thank you, <strong>{name}</strong>. Your {selectedTypeObj?.label} consultation has been{wasQueued ? " saved" : " received"}.
              </p>
              {wasQueued ? (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#1d4ed8" }}>
                  📶 You're currently offline. Your request will be sent automatically once you're back online.
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                  Our team will review and respond to <strong>{email}</strong> shortly.
                </p>
              )}
              <button onClick={() => navigate("/")}
                style={{ padding: "12px 32px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Back to Home
              </button>
            </div>
          )}

          {step !== "success" && (
            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
                ← Back to Home
              </button>
            </p>
          )}
        </div>
      </div>

      <AiChatPanel
        section="consultation"
        endpoint="/api/ai/hybrid"
        placeholder="Ask about consultations, scheduling, or what to prepare..."
        greeting="Hello! I'm your Consultation assistant. I can help you choose the right consultation type, prepare questions, and understand what to expect."
        headerLabel="AgriAI — Consultation"
      />
    </div>
  );
}

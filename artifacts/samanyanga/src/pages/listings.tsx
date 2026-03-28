import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: string;
  price: number;
  location: string;
  imageUrl?: string;
  sellerName: string;
  sellerPhone?: string;
}

const CATEGORIES = ["Vegetables", "Fruits", "Livestock", "Seeds & Inputs", "Equipment", "Other"];

const emptyForm = { name: "", description: "", category: "Vegetables", quantity: "", price: 0, location: "", imageUrl: "", sellerName: "", sellerPhone: "" };

export default function Listings() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => apiRequest("GET", "/api/products"),
  });

  const token = localStorage.getItem("token");

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/products", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/products"] }); setShowForm(false); setForm(emptyForm); },
    onError: (err: any) => alert("Failed: " + err.message),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, category: p.category, quantity: p.quantity, price: p.price, location: p.location, imageUrl: p.imageUrl || "", sellerName: p.sellerName, sellerPhone: p.sellerPhone || "" });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  if (!token) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#374151", fontWeight: 700 }}>Please log in to manage your listings.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📋 My Listings</h2>
          <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>Create and manage your product listings</p>
        </div>
        <button
          onClick={openCreate}
          style={{ padding: "9px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          + New Listing
        </button>
      </div>

      {isLoading ? (
        <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Loading...</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 12, border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: 48 }}>📦</div>
          <p style={{ fontWeight: 700, color: "#374151", marginTop: 12 }}>No listings yet</p>
          <p style={{ color: "#6b7280", fontSize: 13 }}>Create your first listing to start selling</p>
          <button onClick={openCreate} style={{ marginTop: 16, padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Create Listing
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, display: "flex", gap: 14, alignItems: "start" }}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, background: "#d1fae5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🌿</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{p.name}</h4>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#16a34a" }}>${p.price}</span>
                </div>
                <p style={{ margin: "4px 0 6px", fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>{p.description}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 999, fontSize: 11 }}>{p.category}</span>
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontSize: 11 }}>Qty: {p.quantity}</span>
                  <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 999, fontSize: 11 }}>📍 {p.location}</span>
                </div>
              </div>
              <button
                onClick={() => openEdit(p)}
                style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: "min(520px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>{editing ? "Edit Listing" : "New Listing"}</h3>
            <form onSubmit={handleSubmit}>
              {([
                ["name", "Product Name", "text"],
                ["description", "Description", "textarea"],
                ["quantity", "Quantity (e.g. 50kg)", "text"],
                ["price", "Price (USD)", "number"],
                ["location", "Location", "text"],
                ["imageUrl", "Image URL (optional)", "text"],
                ["sellerName", "Your Name", "text"],
                ["sellerPhone", "Your Phone (optional)", "text"],
              ] as const).map(([field, label, type]) => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      value={String(form[field as keyof typeof form])}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      rows={3}
                      required={field !== "imageUrl" && field !== "sellerPhone"}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box", resize: "vertical" }}
                    />
                  ) : (
                    <input
                      type={type as string}
                      value={String(form[field as keyof typeof form])}
                      onChange={e => setForm(f => ({ ...f, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
                      required={field !== "imageUrl" && field !== "sellerPhone"}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                    />
                  )}
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, background: "#fff" }}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="submit" disabled={createMutation.isPending} style={{ flex: 1, padding: "11px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  {createMutation.isPending ? "Saving..." : editing ? "Update" : "Create Listing"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

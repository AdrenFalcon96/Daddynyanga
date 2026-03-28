import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Livestock", "Seeds & Inputs", "Equipment", "Other"];

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: string;
  price: number;
  location: string;
  image_url?: string;
  imageUrl?: string;
  seller_name?: string;
  sellerName?: string;
  seller_phone?: string;
  sellerPhone?: string;
  status?: string;
}

function getField<T>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}

function StatusBadge({ status }: { status?: string }) {
  const s = status || "available";
  const isSold = s === "sold";
  return (
    <span style={{
      background: isSold ? "#fee2e2" : s === "reserved" ? "#fef3c7" : "#d1fae5",
      color: isSold ? "#991b1b" : s === "reserved" ? "#92400e" : "#065f46",
      padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: "capitalize"
    }}>
      {s}
    </span>
  );
}

function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [form, setForm] = useState({ buyerName: "", buyerPhone: "", message: "" });
  const imageUrl = getField<string>(product, "image_url", "imageUrl");
  const sellerName = getField<string>(product, "seller_name", "sellerName");
  const sellerPhone = getField<string>(product, "seller_phone", "sellerPhone");
  const isSold = product.status === "sold";

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", `/api/products/${product.id}/request`, {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      message: data.message,
    }),
    onSuccess: () => { alert("Request sent! The seller will contact you."); onClose(); },
    onError: (err: any) => alert("Failed: " + err.message),
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "min(500px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>{product.name}</h3>
            <StatusBadge status={product.status} />
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>
        {imageUrl && <img src={imageUrl} alt={product.name} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{product.category}</span>
          <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Qty: {product.quantity}</span>
          <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>📍 {product.location}</span>
        </div>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>{product.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "12px 0", borderTop: "1px solid #e5e7eb" }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Seller: <strong>{sellerName}</strong></p>
            {sellerPhone && <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{sellerPhone}</p>}
          </div>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>${product.price}</span>
        </div>

        {isSold ? (
          <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: 8, textAlign: "center", color: "#991b1b", fontWeight: 600, fontSize: 14 }}>
            This product has been sold
          </div>
        ) : (
          <>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Request this Product</h4>
            {(["buyerName", "buyerPhone", "message"] as const).map(field => (
              <div key={field} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  {field === "buyerName" ? "Your Name" : field === "buyerPhone" ? "Your Phone" : "Message (optional)"}
                </label>
                {field === "message" ? (
                  <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={2}
                    placeholder="Any specific requirements..."
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box", resize: "vertical" }} />
                ) : (
                  <input type="text" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required={field !== "message"}
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, marginTop: 4, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.buyerName || !form.buyerPhone}
              style={{ width: "100%", padding: "11px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
              {mutation.isPending ? "Sending..." : "Send Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", category],
    queryFn: () => apiRequest("GET", `/api/products${category !== "All" ? `?category=${encodeURIComponent(category)}` : ""}`),
  });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>🌽 AgriMarketplace</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Browse agricultural products from farmers across Zimbabwe</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          style={{ flex: "1 1 200px", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Loading products...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <p style={{ color: "#374151", fontWeight: 700, marginTop: 8 }}>No products found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
          {filtered.map(p => {
            const imgUrl = getField<string>(p, "image_url", "imageUrl");
            const isSold = p.status === "sold";
            return (
              <div key={p.id} onClick={() => setSelected(p)}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", opacity: isSold ? 0.7 : 1 }}>
                <div style={{ position: "relative" }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={p.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ height: 120, background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🌿</div>
                  )}
                  {isSold && (
                    <div style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>SOLD</div>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{p.name}</h4>
                    <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{p.category}</span>
                  </div>
                  <p style={{ margin: "6px 0 8px", fontSize: 12, color: "#6b7280", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>📍 {p.location}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#16a34a" }}>${p.price}</span>
                  </div>
                  <button style={{ width: "100%", marginTop: 10, padding: "7px", background: isSold ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {isSold ? "Sold Out" : "View & Request"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selected && <ProductDetailModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

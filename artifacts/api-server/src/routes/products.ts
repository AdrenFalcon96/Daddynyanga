import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { query } from "../lib/db";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const parts = auth.slice(7).split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: "Token expired" });
    }
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

const router: IRouter = Router();

async function seedProducts() {
  const check = await query("SELECT count(*) FROM products");
  if (Number(check.rows[0].count) > 0) return;
  await query(`
    INSERT INTO products (name, category, description, price, quantity, location, image_url, seller_name, seller_phone, status)
    VALUES
      ('Fresh Maize', 'Vegetables', 'Freshly harvested open-pollinated maize, sun-dried. Available in 50kg bags.', 25, '500kg', 'Harare',
       'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400', 'Tariro Dube', '263771234567', 'available'),
      ('Hereford Cattle', 'Livestock', 'Grade A Hereford cattle, 18 months old, pasture-raised. Ideal for beef production.', 850, '5 head', 'Bulawayo',
       'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400', 'Munyaradzi Mhuri', '263772345678', 'available'),
      ('Organic Tomatoes', 'Vegetables', 'Pesticide-free organic tomatoes, various sizes. Perfect for resale or food processing.', 12, '200kg', 'Mutare',
       'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400', 'Chiedza Farm', '263773456789', 'available'),
      ('Mango (Tommy Atkins)', 'Fruits', 'Premium export-grade mangoes from Muzarabani. Sweet, firm, and pest-free.', 18, '2 tonnes', 'Muzarabani',
       'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', 'Blessing Orchards', '263774567890', 'available')
  `);
}

seedProducts().catch(console.error);

router.get("/products", async (req, res) => {
  const { category } = req.query;
  try {
    let sql = "SELECT * FROM products";
    const params: string[] = [];
    if (category && category !== "All") {
      sql += " WHERE LOWER(category) = LOWER($1)";
      params.push(String(category));
    }
    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/products", requireAuth, async (req, res) => {
  const { name, description, category, quantity, price, location, imageUrl, image_url, sellerName, seller_name, sellerPhone, seller_phone } = req.body;
  const imgUrl = imageUrl || image_url || null;
  const sName = sellerName || seller_name;
  const sPhone = sellerPhone || seller_phone || null;
  if (!name || !description || !category || !quantity || price === undefined || !location || !sName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await query(
      `INSERT INTO products (name, description, category, quantity, price, location, image_url, seller_name, seller_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available') RETURNING *`,
      [name, description, category, quantity, Number(price), location, imgUrl, sName, sPhone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/products/:id/request", async (req, res) => {
  const { buyerName, buyer_name, buyerPhone, buyer_phone, message } = req.body;
  const bName = buyerName || buyer_name;
  const bPhone = buyerPhone || buyer_phone;
  if (!bName || !bPhone) {
    return res.status(400).json({ error: "buyerName and buyerPhone are required" });
  }
  try {
    const prod = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (prod.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const result = await query(
      `INSERT INTO product_requests (product_id, buyer_name, buyer_phone, message, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [req.params.id, bName, bPhone, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/products/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["available", "sold", "reserved"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    const result = await query("UPDATE products SET status = $1 WHERE id = $2 RETURNING *", [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { query } from "../lib/db";

const router: IRouter = Router();

async function seedAds() {
  const check = await query("SELECT count(*) FROM ads");
  if (Number(check.rows[0].count) > 0) return;
  await query(`
    INSERT INTO ads (title, description, image_url, type, whatsapp, published)
    VALUES
      ('Fresh Tomatoes from Masvingo Farm', 'Premium quality tomatoes available in bulk. 50kg bags at competitive prices. Direct from farm to your table.',
       'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=600', 'image', '263771234567', true),
      ('Mutare Dairy — Fresh Milk Daily', 'Pure, pasteurised milk delivered daily to Harare. Bulk orders welcome. Quality guaranteed.',
       'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600', 'image', '263772345678', true)
  `);
}

seedAds().catch(console.error);

router.get("/ads", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM ads WHERE published = true ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ads/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM ads WHERE id = $1 AND published = true", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Ad not found" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/advert-requests", async (req, res) => {
  const { name, email, phone, description, message, type = "standard" } = req.body;
  const msg = message || description;
  if (!name || !email || !msg) {
    return res.status(400).json({ error: "name, email, and message are required" });
  }
  try {
    const result = await query(
      `INSERT INTO advert_requests (name, email, phone, message, type, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'unpaid') RETURNING *`,
      [name, email, phone || null, msg, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHmac } from "crypto";
import { query } from "../lib/db";

const router: IRouter = Router();
const SECRET = "samanyanga-fixed-secret-2024";

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const parts = auth.slice(7).split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (payload.role !== "admin" && payload.email !== "admin@demo.com") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.get("/admin/advert-requests", adminAuth, async (_req, res) => {
  try {
    const result = await query("SELECT * FROM advert_requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/product-requests", adminAuth, async (_req, res) => {
  try {
    const result = await query(`
      SELECT pr.*, p.name as product_name, p.price as product_price, p.location
      FROM product_requests pr
      LEFT JOIN products p ON pr.product_id = p.id
      ORDER BY pr.created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/generate-image", adminAuth, async (req, res) => {
  const { requestId, prompt } = req.body;
  const imageUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
  try {
    if (requestId) {
      await query(
        "UPDATE advert_requests SET generated_image_url = $1, status = 'approved' WHERE id = $2",
        [imageUrl, requestId]
      );
      const r = await query("SELECT * FROM advert_requests WHERE id = $1", [requestId]);
      const req2 = r.rows[0];
      if (req2) {
        await query(
          `INSERT INTO ads (title, description, image_url, type, published)
           VALUES ($1, $2, $3, 'image', true)`,
          [req2.name || "Generated Ad", req2.message || prompt || "", imageUrl]
        );
      }
    }
    res.json({ imageUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/generate-video", adminAuth, async (req, res) => {
  const { requestId, prompt } = req.body;
  const videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
  try {
    if (requestId) {
      await query(
        "UPDATE advert_requests SET generated_video_url = $1, status = 'approved' WHERE id = $2",
        [videoUrl, requestId]
      );
      const r = await query("SELECT * FROM advert_requests WHERE id = $1", [requestId]);
      const req2 = r.rows[0];
      if (req2) {
        await query(
          `INSERT INTO ads (title, description, video_url, type, published)
           VALUES ($1, $2, $3, 'video', true)`,
          [req2.name || "Generated Video Ad", req2.message || prompt || "", videoUrl]
        );
      }
    }
    res.json({ videoUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/advert-requests/:id", adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await query(
      "UPDATE advert_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/product-requests/:id", adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await query(
      "UPDATE product_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    if (status === "accepted") {
      await query("UPDATE products SET status = 'sold' WHERE id = (SELECT product_id FROM product_requests WHERE id = $1)", [req.params.id]);
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

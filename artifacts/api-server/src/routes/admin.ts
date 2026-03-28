import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { query } from "../lib/db";
import { verifyToken } from "../lib/jwt";

const router: IRouter = Router();

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = verifyToken(auth.slice(7));
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Forbidden — admin role required" });
    }
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Advert Requests ─────────────────────────────────────────────────────────
router.get("/admin/advert-requests", adminAuth, async (_req, res) => {
  try {
    const result = await query("SELECT * FROM advert_requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/advert-requests/:id", adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await query(
      "UPDATE advert_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/advert-requests/:id/publish", adminAuth, async (req, res) => {
  const { title: customTitle } = req.body;
  try {
    const r = await query("SELECT * FROM advert_requests WHERE id = $1", [req.params.id]);
    const ar = r.rows[0];
    if (!ar) return res.status(404).json({ error: "Advert request not found" });
    const adType = ar.advert_type || (ar.generated_video_url ? "video" : "image");
    const mediaUrl = adType === "video" ? ar.generated_video_url : ar.generated_image_url;
    const result = await query(
      `INSERT INTO ads (title, description, image_url, video_url, type, whatsapp, published)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [customTitle || ar.name, ar.message, adType === "image" ? mediaUrl : null, adType === "video" ? mediaUrl : null, adType, ar.phone || null]
    );
    await query("UPDATE advert_requests SET status = 'approved' WHERE id = $1", [req.params.id]);
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Ads (Media Hub) ──────────────────────────────────────────────────────────
router.get("/admin/ads", adminAuth, async (_req, res) => {
  try {
    const result = await query("SELECT * FROM ads ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/ads", adminAuth, async (req, res) => {
  const { title, description, image_url, video_url, type, whatsapp, published } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  try {
    const result = await query(
      `INSERT INTO ads (title, description, image_url, video_url, type, whatsapp, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description || null, image_url || null, video_url || null, type || "image", whatsapp || null, published ?? false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/ads/:id", adminAuth, async (req, res) => {
  const { title, description, image_url, video_url, type, whatsapp, published } = req.body;
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
  if (image_url !== undefined) { fields.push(`image_url = $${idx++}`); values.push(image_url || null); }
  if (video_url !== undefined) { fields.push(`video_url = $${idx++}`); values.push(video_url || null); }
  if (type !== undefined) { fields.push(`type = $${idx++}`); values.push(type); }
  if (whatsapp !== undefined) { fields.push(`whatsapp = $${idx++}`); values.push(whatsapp || null); }
  if (published !== undefined) { fields.push(`published = $${idx++}`); values.push(published); }
  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
  values.push(req.params.id);
  try {
    const result = await query(`UPDATE ads SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/admin/ads/:id", adminAuth, async (req, res) => {
  try {
    await query("DELETE FROM ads WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Product Requests ─────────────────────────────────────────────────────────
router.get("/admin/product-requests", adminAuth, async (_req, res) => {
  try {
    const result = await query(`
      SELECT pr.*, p.name as product_name, p.price as product_price, p.location
      FROM product_requests pr
      LEFT JOIN products p ON pr.product_id = p.id
      ORDER BY pr.created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Consultations ─────────────────────────────────────────────────────────────
router.get("/admin/consultations", adminAuth, async (_req, res) => {
  try {
    const result = await query("SELECT * FROM consultations ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/consultations/:id", adminAuth, async (req, res) => {
  const { response, status } = req.body;
  try {
    const result = await query(
      "UPDATE consultations SET response = $1, status = $2 WHERE id = $3 RETURNING *",
      [response, status || "responded", req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Revenue ───────────────────────────────────────────────────────────────────
router.get("/admin/revenue", adminAuth, async (_req, res) => {
  try {
    const adverts = await query(`
      SELECT COUNT(*) as total_adverts,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_adverts,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND type = 'premium' THEN 25
                         WHEN payment_status = 'paid' THEN 10 ELSE 0 END), 0) as advert_revenue
      FROM advert_requests
    `);
    const consultations = await query(`
      SELECT COUNT(*) as total_consultations,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_consultations,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN 5 ELSE 0 END), 0) as consultation_revenue
      FROM consultations
    `);
    const adData = adverts.rows[0];
    const conData = consultations.rows[0];
    const totalRevenue = Number(adData.advert_revenue) + Number(conData.consultation_revenue);
    res.json({
      totalRevenue: totalRevenue.toFixed(2),
      adverts: adData,
      consultations: conData,
      ecocashAccount: "0783652488",
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/admin/transactions", adminAuth, async (_req, res) => {
  try {
    const result = await query(`
      SELECT id, name, email, phone, message, type, status, payment_status, created_at, 'advert' as source, generated_image_url, generated_video_url
      FROM advert_requests
      UNION ALL
      SELECT id, name, email, phone, message, type, status, payment_status, created_at, 'consultation' as source, NULL as generated_image_url, NULL as generated_video_url
      FROM consultations
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/admin/transactions/:source/:id", adminAuth, async (req, res) => {
  const { source, id } = req.params;
  const { payment_status } = req.body;
  if (!["paid", "pending", "unpaid", "refunded"].includes(payment_status)) {
    return res.status(400).json({ error: "Invalid payment_status" });
  }
  try {
    const table = source === "consultation" ? "consultations" : "advert_requests";
    const result = await query(`UPDATE ${table} SET payment_status = $1 WHERE id = $2 RETURNING *`, [payment_status, id]);
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Generate Image (DALL-E or placeholder) ────────────────────────────────────
router.post("/admin/generate-image", adminAuth, async (req, res) => {
  const { requestId, prompt } = req.body;
  let imageUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
  let source = "placeholder";

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && prompt) {
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: openaiKey });
      const imgRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional agricultural advertisement for Zimbabwe marketplace: ${prompt}`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      if (imgRes.data[0]?.url) { imageUrl = imgRes.data[0].url; source = "openai"; }
    } catch (err: any) {
      console.warn("[DALL-E] image generation failed:", err?.message);
    }
  }

  try {
    if (requestId) {
      await query(
        "UPDATE advert_requests SET generated_image_url = $1, status = 'approved', advert_type = 'image' WHERE id = $2",
        [imageUrl, requestId]
      );
      const r = await query("SELECT * FROM advert_requests WHERE id = $1", [requestId]);
      const ar = r.rows[0];
      if (ar) {
        await query(
          `INSERT INTO ads (title, description, image_url, type, published) VALUES ($1, $2, $3, 'image', true)`,
          [ar.name || "Generated Ad", ar.message || prompt || "", imageUrl]
        );
      }
    }
    res.json({ imageUrl, source });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Generate Video (SISIF.AI or placeholder) ──────────────────────────────────
router.post("/admin/generate-video", adminAuth, async (req, res) => {
  const { requestId, prompt } = req.body;
  let videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
  let videoSource = "placeholder";
  const sisifKey = process.env.SISIF_AI_API_KEY;
  if (sisifKey && prompt) {
    try {
      const submitRes = await fetch("https://sisif.ai/api/videos/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sisifKey}` },
        body: JSON.stringify({ prompt, duration: 8, resolution: "540x960" }),
      });
      if (submitRes.ok) {
        const job: any = await submitRes.json();
        const jobId: string = job?.id;
        if (jobId) {
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 6000));
            try {
              const st: any = await (await fetch(`https://sisif.ai/api/videos/${jobId}/status/`, { headers: { Authorization: `Bearer ${sisifKey}` } })).json();
              if (st?.status === "ready" && st?.video_url) { videoUrl = st.video_url; videoSource = "sisif"; break; }
              if (st?.status === "failed") break;
            } catch { /* keep polling */ }
          }
        }
      }
    } catch (e: any) { console.warn("[SISIF.AI] error:", e?.message); }
  }
  try {
    if (requestId) {
      await query(
        "UPDATE advert_requests SET generated_video_url = $1, status = 'approved', advert_type = 'video' WHERE id = $2",
        [videoUrl, requestId]
      );
      const r = await query("SELECT * FROM advert_requests WHERE id = $1", [requestId]);
      const ar = r.rows[0];
      if (ar) {
        await query(
          `INSERT INTO ads (title, description, video_url, type, published) VALUES ($1, $2, $3, 'video', true)`,
          [ar.name || "Generated Video Ad", ar.message || prompt || "", videoUrl]
        );
      }
    }
    res.json({ videoUrl, source: videoSource });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Study Materials ───────────────────────────────────────────────────────────
router.get("/admin/study-materials", adminAuth, async (_req, res) => {
  try {
    const result = await query(
      "SELECT id, title, description, grade, subject, file_type, file_name, mime_type, uploaded_at FROM study_materials ORDER BY uploaded_at DESC"
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/study-materials", adminAuth, async (req, res) => {
  const { title, description, grade, subject, file_type, file_data, file_name, mime_type } = req.body;
  if (!title || !grade || !file_type) return res.status(400).json({ error: "title, grade, and file_type are required" });
  try {
    const result = await query(
      `INSERT INTO study_materials (title, description, grade, subject, file_type, file_data, file_name, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, grade, subject, file_type, file_name, mime_type, uploaded_at`,
      [title, description || null, grade, subject || null, file_type, file_data || null, file_name || null, mime_type || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/admin/study-materials/:id", adminAuth, async (req, res) => {
  try {
    await query("DELETE FROM study_materials WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Study Materials (public) ──────────────────────────────────────────────────
router.get("/study-materials", async (req, res) => {
  const { grade, subject } = req.query;
  try {
    let sql = "SELECT id, title, description, grade, subject, file_type, file_name, mime_type, uploaded_at FROM study_materials WHERE 1=1";
    const params: any[] = [];
    if (grade) { params.push(String(grade)); sql += ` AND grade = $${params.length}`; }
    if (subject) { params.push(String(subject)); sql += ` AND LOWER(subject) = LOWER($${params.length})`; }
    sql += " ORDER BY uploaded_at DESC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/study-materials/:id/data", async (req, res) => {
  try {
    const result = await query("SELECT file_data, file_name, mime_type FROM study_materials WHERE id = $1", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    const mat = result.rows[0];
    if (!mat.file_data) return res.status(404).json({ error: "No file data" });
    if (mat.file_data.startsWith("http")) return res.redirect(mat.file_data);
    const base64Data = mat.file_data.includes(",") ? mat.file_data.split(",")[1] : mat.file_data;
    const buffer = Buffer.from(base64Data, "base64");
    res.setHeader("Content-Type", mat.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${mat.file_name || "file"}"`);
    res.send(buffer);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Subjects Management ───────────────────────────────────────────────────────
router.get("/admin/subjects", adminAuth, async (_req, res) => {
  try {
    const result = await query("SELECT * FROM subjects ORDER BY grade, name");
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/subjects", adminAuth, async (req, res) => {
  const { name, grade, category } = req.body;
  if (!name || !grade) return res.status(400).json({ error: "name and grade are required" });
  try {
    const result = await query(
      "INSERT INTO subjects (name, grade, category) VALUES ($1, $2, $3) RETURNING *",
      [name, grade, category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Subject already exists for this grade" });
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/subjects/:id", adminAuth, async (req, res) => {
  const { name, grade, category, active } = req.body;
  try {
    const result = await query(
      `UPDATE subjects SET
        name = COALESCE($1, name),
        grade = COALESCE($2, grade),
        category = COALESCE($3, category),
        active = COALESCE($4, active)
       WHERE id = $5 RETURNING *`,
      [name ?? null, grade ?? null, category ?? null, active ?? null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/admin/subjects/:id", adminAuth, async (req, res) => {
  try {
    await query("DELETE FROM subjects WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Public subjects endpoint (used by StudentCompanion)
router.get("/subjects", async (req, res) => {
  const { grade } = req.query;
  try {
    let sql = "SELECT id, name, grade, category FROM subjects WHERE active = true";
    const params: any[] = [];
    if (grade) { params.push(String(grade)); sql += ` AND grade = $1`; }
    sql += " ORDER BY grade, category, name";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;

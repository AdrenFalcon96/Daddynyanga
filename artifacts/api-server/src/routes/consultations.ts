import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { query } from "../lib/db";
import { verifyToken } from "../lib/jwt";

const router: IRouter = Router();

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      response TEXT,
      payment_status TEXT NOT NULL DEFAULT 'free',
      payment_ref TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
ensureTable().catch(console.error);

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

router.post("/consultations", async (req, res) => {
  const { name, email, phone, type, message } = req.body;
  if (!name || !email || !type || !message) {
    return res.status(400).json({ error: "name, email, type, and message are required" });
  }
  const freeTypes = ["student", "farmer", "buyer", "seller", "intern"];
  const paymentStatus = freeTypes.includes(type) ? "free" : "pending";
  let paymentRef: string | null = null;
  if (paymentStatus === "pending") {
    paymentRef = `CONSULT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  try {
    const result = await query(
      `INSERT INTO consultations (name, email, phone, type, message, payment_status, payment_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, phone || null, type, message, paymentStatus, paymentRef]
    );
    res.status(201).json({ consultation: result.rows[0], paymentRef });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/consultations/:id/confirm-payment", async (req, res) => {
  const { paymentRef } = req.body;
  if (!paymentRef) return res.status(400).json({ error: "paymentRef required" });
  try {
    const result = await query(
      "UPDATE consultations SET payment_status = 'paid', status = 'pending' WHERE id = $1 AND payment_ref = $2 RETURNING *",
      [req.params.id, paymentRef]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Consultation not found or ref mismatch" });
    res.json({ success: true, consultation: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/consultations", adminAuth, async (_req, res) => {
  try {
    const result = await query("SELECT * FROM consultations ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/consultations/:id", adminAuth, async (req, res) => {
  const { response, status } = req.body;
  try {
    const result = await query(
      "UPDATE consultations SET response = $1, status = COALESCE($2, 'responded') WHERE id = $3 RETURNING *",
      [response, status || "responded", req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/revenue", adminAuth, async (_req, res) => {
  try {
    const advertRevenue = await query(`
      SELECT
        COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_adverts,
        COUNT(*) FILTER (WHERE payment_status = 'pending') AS pending_adverts,
        COUNT(*) AS total_adverts
      FROM advert_requests
    `);
    const consultRevenue = await query(`
      SELECT
        COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_consultations,
        COUNT(*) FILTER (WHERE payment_status = 'pending') AS pending_consultations,
        COUNT(*) AS total_consultations
      FROM consultations
    `);
    const recentPayments = await query(`
      SELECT 'advert' as source, name, email, type, payment_status, created_at
      FROM advert_requests WHERE payment_status IN ('paid','pending')
      UNION ALL
      SELECT 'consultation' as source, name, email, type, payment_status, created_at
      FROM consultations WHERE payment_status IN ('paid','pending')
      ORDER BY created_at DESC LIMIT 20
    `);
    const paidAdverts = parseInt(advertRevenue.rows[0]?.paid_adverts || 0);
    const paidConsultations = parseInt(consultRevenue.rows[0]?.paid_consultations || 0);
    const totalRevenue = paidAdverts * 10 + paidConsultations * 5;
    res.json({
      adverts: advertRevenue.rows[0],
      consultations: consultRevenue.rows[0],
      totalRevenue,
      recentPayments: recentPayments.rows,
      ecocashAccount: "0783652488",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

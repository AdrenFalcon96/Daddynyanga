import { Router, type IRouter } from "express";
import { query } from "../lib/db";

const router: IRouter = Router();

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS intern_attachment_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      institution TEXT NOT NULL,
      program TEXT NOT NULL,
      year TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      response TEXT,
      farmer_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch(console.error);

router.post("/intern-attachments", async (req, res) => {
  const { student_name, student_email, institution, program, year, message } = req.body;
  if (!student_name || !student_email || !institution || !program || !year) {
    res.status(400).json({ error: "student_name, student_email, institution, program, and year are required" }); return;
  }
  try {
    const result = await query(
      `INSERT INTO intern_attachment_requests (student_name, student_email, institution, program, year, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [student_name, student_email, institution, program, year, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/intern-attachments", async (req, res) => {
  const { email } = req.query;
  try {
    let result;
    if (email) {
      result = await query(
        "SELECT * FROM intern_attachment_requests WHERE student_email = $1 ORDER BY created_at DESC",
        [email]
      );
    } else {
      result = await query("SELECT * FROM intern_attachment_requests ORDER BY created_at DESC");
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/intern-attachments/:id", async (req, res) => {
  const { status, response } = req.body;
  try {
    const result = await query(
      "UPDATE intern_attachment_requests SET status = $1, response = $2 WHERE id = $3 RETURNING *",
      [status, response || null, req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: "Request not found" }); return; }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken, requireAuth } from "../lib/auth.js";
import { query } from "../lib/db.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/admin-setup/status", (_req, res) => {
  const configured =
    !!process.env["ADMIN_EMAIL"] && !!process.env["ADMIN_PASSWORD_HASH"];
  res.json({ configured });
});

router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const expectedEmail = process.env["ADMIN_EMAIL"];
    const expectedHash = process.env["ADMIN_PASSWORD_HASH"];

    if (!expectedEmail || !expectedHash) {
      res.status(503).json({ error: "Admin credentials not configured on this server" });
      return;
    }

    const emailMatch = email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
    const passwordMatch = emailMatch ? await bcrypt.compare(password, expectedHash) : false;

    if (!emailMatch || !passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = await signToken({ sub: "admin", role: "admin", email: expectedEmail }, "1h");
    res.json({ token, role: "admin" });
  } catch (err) {
    logger.error({ err }, "Admin login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin-recovery", async (req, res) => {
  try {
    const { recovery_code } = req.body as { recovery_code?: string };
    if (!recovery_code) {
      res.status(400).json({ error: "recovery_code is required" });
      return;
    }

    const expectedCode = process.env["ADMIN_RECOVERY_CODE"];
    if (!expectedCode) {
      res.status(503).json({ error: "Recovery code not configured on this server" });
      return;
    }

    if (recovery_code !== expectedCode) {
      res.status(401).json({ error: "Invalid recovery code" });
      return;
    }

    const email = process.env["ADMIN_EMAIL"] ?? "admin";
    const token = await signToken(
      { sub: "admin-recovery", role: "admin-readonly", email },
      "30m",
    );
    res.json({ token, role: "admin-readonly", message: "Read-only admin access granted for 30 minutes" });
  } catch (err) {
    logger.error({ err }, "Admin recovery error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, display_name } = req.body as {
      email?: string;
      password?: string;
      display_name?: string;
    };

    if (!email || !password || !display_name) {
      res.status(400).json({ error: "email, password, and display_name are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await query("SELECT id FROM sh_student_users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO sh_student_users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at",
      [email.toLowerCase(), hash, display_name.trim()],
    );

    const user = result.rows[0];
    const token = await signToken(
      { sub: String(user.id), role: "student", email: user.email },
      "7d",
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, display_name: user.display_name } });
  } catch (err) {
    logger.error({ err }, "Student register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const result = await query(
      "SELECT id, email, password_hash, display_name FROM sh_student_users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = await signToken(
      { sub: String(user.id), role: "student", email: user.email },
      "7d",
    );

    res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name } });
  } catch (err) {
    logger.error({ err }, "Student login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: { id: req.user.sub, email: req.user.email, role: req.user.role } });
});

export default router;

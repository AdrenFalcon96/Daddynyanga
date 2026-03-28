import { Router, type IRouter } from "express";
import { createHmac } from "crypto";
import { query } from "../lib/db";

const router: IRouter = Router();
const SECRET = process.env.JWT_SECRET || "samanyanga-fixed-secret-2024";

function hashPassword(password: string): string {
  return createHmac("sha256", SECRET).update(password).digest("hex");
}

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

async function seedDemoUsers() {
  const demos = [
    ["farmer@demo.com", "demo123", "farmer", "Demo Farmer"],
    ["student@demo.com", "demo123", "student", "Demo Student"],
    ["buyer@demo.com", "demo123", "merchant", "Demo Buyer"],
    ["seller@demo.com", "demo123", "seller", "Demo Seller"],
    ["admin@demo.com", "demo123", "admin", "Admin"],
  ];
  for (const [email, pass, role, displayName] of demos) {
    await query(
      `INSERT INTO users (email, password, role, display_name)
       VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      [email, hashPassword(pass), role, displayName]
    );
  }
}

seedDemoUsers().catch(console.error);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  try {
    const result = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    const user = result.rows[0];
    if (!user || user.password !== hashPassword(String(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = makeToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const allowedRoles = ["farmer", "merchant", "seller", "student", "agri_intern"];
  const userRole = allowedRoles.includes(role) ? role : "farmer";
  try {
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (existing.rows.length > 0) return res.status(409).json({ message: "Email already in use" });
    const result = await query(
      "INSERT INTO users (email, password, role, display_name) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, hashPassword(String(password)), userRole, String(email).split("@")[0]]
    );
    const user = result.rows[0];
    const token = makeToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const parts = auth.slice(7).split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const result = await query("SELECT * FROM users WHERE id = $1", [payload.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, role: user.role, displayName: user.display_name });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

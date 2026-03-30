import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { signToken, verifyToken, hashPassword, hashBcrypt, verifyBcrypt } from "../lib/jwt";

const router: IRouter = Router();

// ── Admin identity — loaded from environment, never hardcoded ─────────────────
const ADMIN_EMAIL = process.env["ADMIN_EMAIL"];
const RECOVERY_CODE = process.env["ADMIN_RECOVERY_CODE"];

if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL environment variable is not set. Server cannot start.");
}
if (!RECOVERY_CODE) {
  throw new Error("ADMIN_RECOVERY_CODE environment variable is not set. Server cannot start.");
}

// ── Demo user seeding (no passwords — admin sets them via Security tab) ──────
async function seedDemoUsers() {
  const demos: [string, string, string][] = [
    ["farmer@demo.com",  "farmer",  "Demo Farmer"],
    ["student@demo.com", "student", "Demo Student"],
    ["buyer@demo.com",   "merchant","Demo Buyer"],
    ["seller@demo.com",  "seller",  "Demo Seller"],
  ];
  for (const [email, role, displayName] of demos) {
    await query(
      `INSERT INTO users (email, password, role, display_name)
       VALUES ($1, '__unset__', $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [email, role, displayName]
    );
  }
}

seedDemoUsers().catch(console.error);

// ── Check admin exists ────────────────────────────────────────────────────────
router.get("/admin-setup/status", async (_req, res) => {
  try {
    const result = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", []);
    res.json({ adminExists: result.rows.length > 0 });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── Validate admin email against hardcoded constant (no DB write) ─────────────
router.post("/admin-setup/verify", async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ message: "Email required." }); return; }
  if (String(email).trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({ message: "Unrecognised administrator email." });
    return;
  }
  // Double-check no admin already exists
  const check = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", []);
  if (check.rows.length > 0) {
    res.status(409).json({ message: "Admin account already set up. Please log in." });
    return;
  }
  res.json({ valid: true });
});

// ── First-time admin setup ────────────────────────────────────────────────────
// Only succeeds if: email === ADMIN_EMAIL AND no admin yet exists.
router.post("/admin-setup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." }); return;
  }
  if (String(email).trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({ message: "Unrecognised administrator email." }); return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters." }); return;
  }
  try {
    const adminCheck = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", []);
    if (adminCheck.rows.length > 0) {
      res.status(409).json({ message: "Admin account already exists." }); return;
    }
    const hashed = await hashBcrypt(String(password));
    const existing = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]
    );
    let user: any;
    if (existing.rows.length > 0) {
      const upd = await query(
        "UPDATE users SET role = 'admin', password = $1 WHERE id = $2 RETURNING *",
        [hashed, existing.rows[0].id]
      );
      user = upd.rows[0];
    } else {
      const ins = await query(
        "INSERT INTO users (email, password, role, display_name) VALUES ($1, $2, 'admin', $3) RETURNING *",
        [ADMIN_EMAIL, hashed, "Administrator"]
      );
      user = ins.rows[0];
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin login (password-only; email resolved from constant or body) ─────────
// Body: { password } — uses ADMIN_EMAIL internally
// Body: { email, password } — validates email === ADMIN_EMAIL, then same flow
router.post("/admin-login", async (req, res) => {
  const { password, email: bodyEmail } = req.body;
  if (!password) { res.status(400).json({ message: "Password required." }); return; }

  // If caller supplied an email, it must match the constant
  if (bodyEmail && String(bodyEmail).trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(401).json({ message: "Invalid credentials." }); return;
  }

  try {
    const result = await query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = 'admin'",
      [ADMIN_EMAIL]
    );
    const admin = result.rows[0];
    if (!admin) {
      res.status(401).json({ message: "Admin account not set up yet." }); return;
    }
    const ok = await verifyBcrypt(String(password), admin.password);
    if (!ok) {
      res.status(401).json({ message: "Invalid credentials." }); return;
    }
    const token = signToken({ id: admin.id, email: admin.email, role: admin.role });
    res.json({ token, user: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── Hidden emergency recovery ─────────────────────────────────────────────────
// Accessible only via the hidden UI flow (5-click icon sequence) or direct API.
// Validates the hardcoded RECOVERY_CODE and resets the admin password.
router.post("/admin-emergency", async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) {
    res.status(400).json({ message: "Code and new password required." }); return;
  }
  if (String(code).trim() !== RECOVERY_CODE) {
    res.status(403).json({ message: "Invalid recovery code." }); return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters." }); return;
  }
  try {
    const result = await query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = 'admin'",
      [ADMIN_EMAIL]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "No admin account found. Complete first-time setup first." }); return;
    }
    const hashed = await hashBcrypt(String(password));
    const upd = await query(
      "UPDATE users SET password = $1 WHERE id = $2 RETURNING *",
      [hashed, result.rows[0].id]
    );
    const admin = upd.rows[0];
    const token = signToken({ id: admin.id, email: admin.email, role: admin.role });
    res.json({ token, user: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── Standard login (non-admin users — HMAC-SHA256) ───────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ message: "Email and password required." }); return; }
  try {
    const result = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    const user = result.rows[0];
    if (!user) { res.status(401).json({ message: "Invalid email or password." }); return; }

    // Prevent admin account from logging in via general login
    if (user.role === "admin") {
      res.status(403).json({ message: "Use the Admin Portal to sign in." }); return;
    }

    // Unset password — account created by admin but password not yet assigned
    if (user.password === "__unset__") {
      res.status(401).json({ message: "Your account password has not been set yet. Please contact your administrator." });
      return;
    }

    if (user.password !== hashPassword(String(password))) {
      res.status(401).json({ message: "Invalid email or password." }); return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) { res.status(400).json({ message: "Email and password required." }); return; }
  const allowedRoles = ["farmer", "merchant", "seller", "student", "agri_intern"];
  const userRole = allowedRoles.includes(role) ? role : "farmer";
  try {
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (existing.rows.length > 0) { res.status(409).json({ message: "Email already in use." }); return; }
    const result = await query(
      "INSERT INTO users (email, password, role, display_name) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, hashPassword(String(password)), userRole, String(email).split("@")[0]]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const payload = verifyToken(auth.slice(7));
    const result = await query("SELECT * FROM users WHERE id = $1", [payload.id]);
    const user = result.rows[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ id: user.id, email: user.email, role: user.role, displayName: user.display_name });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

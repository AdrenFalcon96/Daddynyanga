import { Router, type IRouter } from "express";
import { query } from "../lib/db";
import { signToken, verifyToken, hashPassword } from "../lib/jwt";

const router: IRouter = Router();

async function seedDemoUsers() {
  const demos = [
    ["farmer@demo.com", "demo123", "farmer", "Demo Farmer"],
    ["student@demo.com", "demo123", "student", "Demo Student"],
    ["buyer@demo.com", "demo123", "merchant", "Demo Buyer"],
    ["seller@demo.com", "demo123", "seller", "Demo Seller"],
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

// Check whether an admin account exists (used by the setup page)
router.get("/admin-setup/status", async (_req, res) => {
  try {
    const result = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", []);
    res.json({ adminExists: result.rows.length > 0 });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Emergency admin reset — requires ADMIN_RESET_KEY env var to be set on the server
// Use this if you are locked out of an existing admin account.
// Set ADMIN_RESET_KEY in your server environment, call this endpoint, then remove the key.
router.post("/admin-reset", async (req, res) => {
  const resetKey = process.env.ADMIN_RESET_KEY;
  if (!resetKey) {
    res.status(403).json({ message: "Admin reset is not enabled. Set ADMIN_RESET_KEY on the server to enable it." });
    return;
  }
  const { resetKey: providedKey, email, password } = req.body;
  if (!providedKey || providedKey !== resetKey) {
    res.status(403).json({ message: "Invalid reset key." });
    return;
  }
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters." });
    return;
  }
  try {
    // Remove all existing admin accounts
    await query("DELETE FROM users WHERE role = 'admin'", []);
    // Create fresh admin
    const result = await query(
      "INSERT INTO users (email, password, role, display_name) VALUES ($1, $2, 'admin', $3) RETURNING *",
      [email, hashPassword(String(password)), String(email).split("@")[0]]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// First-time admin registration — locked once any admin exists
router.post("/admin-setup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }
  try {
    const adminCheck = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", []);
    if (adminCheck.rows.length > 0) {
      res.status(403).json({ message: "An admin account already exists. Contact the current administrator." });
      return;
    }
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (existing.rows.length > 0) {
      // If the email exists but has a non-admin role, upgrade it; otherwise it is already the admin
      const existingUser = existing.rows[0];
      const upd = await query(
        "UPDATE users SET role = 'admin', password = $1 WHERE id = $2 RETURNING *",
        [hashPassword(String(password)), existingUser.id]
      );
      const user = upd.rows[0];
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
      return;
    }
    const result = await query(
      "INSERT INTO users (email, password, role, display_name) VALUES ($1, $2, 'admin', $3) RETURNING *",
      [email, hashPassword(String(password)), String(email).split("@")[0]]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ message: "Email and password required" }); return; }
  try {
    const result = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    const user = result.rows[0];
    if (!user || user.password !== hashPassword(String(password))) {
      res.status(401).json({ message: "Invalid email or password" }); return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) { res.status(400).json({ message: "Email and password required" }); return; }
  const allowedRoles = ["farmer", "merchant", "seller", "student", "agri_intern"];
  const userRole = allowedRoles.includes(role) ? role : "farmer";
  try {
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (existing.rows.length > 0) { res.status(409).json({ message: "Email already in use" }); return; }
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

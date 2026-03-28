import { Router, type IRouter } from "express";
import { randomUUID, createHmac } from "crypto";

const router: IRouter = Router();

interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  displayName: string;
  createdAt: Date;
}

const SECRET = "samanyanga-fixed-secret-2024";

function hashPassword(password: string): string {
  return createHmac("sha256", SECRET).update(password).digest("hex");
}

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

const DEMO = hashPassword("demo123");

const users: User[] = [
  { id: "demo-farmer", email: "farmer@demo.com", passwordHash: DEMO, role: "farmer", displayName: "Demo Farmer", createdAt: new Date() },
  { id: "demo-student", email: "student@demo.com", passwordHash: DEMO, role: "student", displayName: "Demo Student", createdAt: new Date() },
  { id: "demo-buyer", email: "buyer@demo.com", passwordHash: DEMO, role: "merchant", displayName: "Demo Buyer", createdAt: new Date() },
  { id: "demo-seller", email: "seller@demo.com", passwordHash: DEMO, role: "seller", displayName: "Demo Seller", createdAt: new Date() },
];

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.passwordHash !== hashPassword(String(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = makeToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
});

router.post("/register", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  if (users.find(u => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ message: "Email already in use" });
  }
  const allowedRoles = ["farmer", "merchant", "seller", "student"];
  const userRole = allowedRoles.includes(role) ? role : "farmer";
  const user: User = {
    id: randomUUID(),
    email: String(email),
    passwordHash: hashPassword(String(password)),
    role: userRole,
    displayName: String(email).split("@")[0],
    createdAt: new Date(),
  };
  users.push(user);
  const token = makeToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const parts = auth.slice(7).split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const user = users.find(u => u.id === payload.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

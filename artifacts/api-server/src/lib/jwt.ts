import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET;

function deriveSecret(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    return createHmac("sha256", "samanyanga-jwt-derive-v1").update(dbUrl).digest("hex");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Cannot derive JWT secret: DATABASE_URL is required in production when JWT_SECRET is not set."
    );
  }
  console.warn("[WARN] Neither JWT_SECRET nor DATABASE_URL is set — using insecure dev default.");
  return "samanyanga-dev-only-insecure-secret-change-before-deploy";
}

const EFFECTIVE_SECRET = SECRET ?? deriveSecret();

export function signToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })
  ).toString("base64url");
  const sig = createHmac("sha256", EFFECTIVE_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [header, body, sig] = parts;
  const expectedSig = createHmac("sha256", EFFECTIVE_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  const sigBuf = Buffer.from(sig, "base64url");
  const expectedBuf = Buffer.from(expectedSig, "base64url");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("Invalid token signature");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Record<string, unknown>;
  if (payload.exp && typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  return payload;
}

// ── Legacy password hashing (HMAC-SHA256) — used for non-admin/demo accounts ──
const PASSWORD_SALT = process.env.PASSWORD_SALT || "samanyanga-fixed-secret-2024";

export function hashPassword(password: string): string {
  return createHmac("sha256", PASSWORD_SALT).update(password).digest("hex");
}

// ── Bcrypt — used exclusively for the admin account ──────────────────────────

export async function hashBcrypt(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyBcrypt(password: string, hash: string): Promise<boolean> {
  if (!hash || hash === "__unset__") return false;
  return bcrypt.compare(password, hash);
}

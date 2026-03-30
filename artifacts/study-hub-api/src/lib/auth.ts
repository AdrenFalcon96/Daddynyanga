import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

export interface StudyHubJwtPayload extends JWTPayload {
  sub: string;
  role: "admin" | "admin-readonly" | "student";
  email: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(
  payload: Omit<StudyHubJwtPayload, "iat" | "exp">,
  expiresIn: string = "1h",
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyToken(
  token: string,
): Promise<StudyHubJwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as StudyHubJwtPayload;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: StudyHubJwtPayload;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    logger.debug({ err }, "JWT verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

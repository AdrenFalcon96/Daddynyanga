import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "samanyanga-study-hub-api", timestamp: new Date().toISOString() });
});

export default router;

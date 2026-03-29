import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
app.use(
  cors({
    origin: [
      "https://daddynyanga.onrender.com",
      "https://samanyanga-companion-jmu9.onrender.com",
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "Samanyanga API", status: "running", docs: "/api/health" });
});

app.use("/api", router);

// Serve frontend static build in production (only when SERVE_STATIC is explicitly enabled)
if (process.env.NODE_ENV === "production" && process.env.SERVE_STATIC === "true") {
  const { default: path } = await import("path");
  const { fileURLToPath } = await import("url");
  const { existsSync } = await import("fs");
  const staticDir = process.env.STATIC_DIR
    || path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

  if (existsSync(staticDir)) {
    logger.info({ staticDir }, "Serving static files");
    const { default: expressModule } = await import("express");
    app.use(expressModule.static(staticDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  } else {
    logger.warn({ staticDir }, "Static dir not found, skipping static file serving");
  }
}

export default app;

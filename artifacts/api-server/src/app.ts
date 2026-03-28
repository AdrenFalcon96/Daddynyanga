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
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

// Serve frontend static build in production
if (process.env.NODE_ENV === "production" && process.env.SERVE_STATIC !== "false") {
  const { default: path } = await import("path");
  const { fileURLToPath } = await import("url");
  const staticDir = process.env.STATIC_DIR
    || path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
  logger.info({ staticDir }, "Serving static files");
  const { default: expressModule } = await import("express");
  app.use(expressModule.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;

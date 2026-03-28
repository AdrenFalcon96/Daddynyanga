import http from "http";
import { logger } from "./lib/logger";
import { initDb } from "./lib/initDb";

const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

initDb()
  .then(async () => {
    logger.info("Database initialized");
    const { default: app } = await import("./app");

    const server = http.createServer(app);

    server.on("error", (err) => {
      logger.error({ err }, "Server error");
      process.exit(1);
    });

    server.listen(port, "0.0.0.0", () => {
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to initialize database");
    process.exit(1);
  });

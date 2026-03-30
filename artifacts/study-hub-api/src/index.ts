import http from "http";
import { logger } from "./lib/logger.js";
import { initDb } from "./lib/initDb.js";

const rawPort = process.env["PORT"] ?? "8099";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const REQUIRED_ENV: string[] = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_RECOVERY_CODE",
];

const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error(
    { missing },
    `Study Hub API cannot start — missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

initDb()
  .then(async () => {
    logger.info("Study Hub database initialized");
    const { default: app } = await import("./app.js");

    const server = http.createServer(app);

    server.on("error", (err) => {
      logger.error({ err }, "Server error");
      process.exit(1);
    });

    server.listen(port, "0.0.0.0", () => {
      logger.info({ port }, "Study Hub API listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to initialize Study Hub database");
    process.exit(1);
  });

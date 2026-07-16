require("dotenv").config();

const { createApp } = require("./app");
const logger = require("./logger");
const {
  verifyDatabaseConnection,
  disconnectDatabase
} = require("./database");

const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const app = createApp({ frontendOrigin });
let server;

async function start() {
  await verifyDatabaseConnection();

  server = app.listen(port, () => {
    logger.info("server_started", {
      port,
      frontendOrigin,
      database: "connected"
    });
  });
}

async function shutdown(signal) {
  logger.info("server_shutdown_started", { signal });

  if (server) {
    server.close();
  }

  await disconnectDatabase();
  logger.info("server_shutdown_completed");
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

start().catch((error) => {
  logger.error("server_start_failed", {
    message: error.message
  });
  void disconnectDatabase().finally(() => {
    logger.info("server_shutdown_completed");
    process.exit(0);
  });
});

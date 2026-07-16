const express = require("express");
const cors = require("cors");
const { randomUUID } = require("node:crypto");
const { success, failure } = require("./response");

function createApp({ frontendOrigin }) {
  const app = express();

  app.use(cors({
    origin: frontendOrigin,
    credentials: true
  }));

  app.use(express.json({ limit: "100kb" }));

  app.use((req, res, next) => {
    req.requestId = req.header("x-request-id") || randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  app.get("/health", (req, res) => {
    res.status(200).json(success({
      service: "blindbeat-backend",
      status: "ok"
    }, req.requestId));
  });

  app.use((req, res) => {
    res.status(404).json(failure(
      "ROUTE_NOT_FOUND",
      "İstenen endpoint bulunamadı.",
      req.requestId
    ));
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json(failure(
      "INTERNAL_SERVER_ERROR",
      "Beklenmeyen bir server hatası oluştu.",
      req.requestId
    ));
  });

  return app;
}

module.exports = { createApp };

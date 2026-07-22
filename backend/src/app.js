const express = require("express");
const cors = require("cors");
const { randomUUID } = require("node:crypto");
const { success, failure } = require("./response");

function createApp({ frontendOrigin, lobbyRoutes = express.Router() }) {
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
  
  app.use("/lobbies", lobbyRoutes);

  app.use((req, res) => {
    res.status(404).json(failure(
      "ROUTE_NOT_FOUND",
      "İstenen endpoint bulunamadı.",
      req.requestId
    ));
  });

  app.use((error, req, res, next) => {
    console.error("REQUEST_ERROR:", error);

    if (res.headersSent) {
        return next(error);
    }

    const isKnownError =
        Number.isInteger(error?.statusCode);

    const statusCode = isKnownError
        ? error.statusCode
        : 500;

    const errorCode = isKnownError
        ? error.code
        : "INTERNAL_SERVER_ERROR";

    const errorMessage = isKnownError
        ? error.message
        : "Beklenmeyen bir server hatası oluştu.";

    res.status(statusCode).json(
        failure(
            errorCode,
            errorMessage,
            req.requestId
        )
    );
});

  return app;
}

module.exports = { createApp };

const express = require("express");
const path = require("node:path");
const cors = require("cors");
const { randomUUID } = require("node:crypto");
const { success, failure } = require("./response");

function createAllowedOrigins(frontendOrigin) {
    const isProduction = process.env.NODE_ENV === "production";

    return function isAllowedOrigin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === frontendOrigin) return callback(null, true);

        if (!isProduction) {
            const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:");
            const isLocalIP = origin.startsWith("http://127.0.0.1:") || origin.startsWith("https://127.0.0.1:");
            const isNgrok = /\.ngrok\.io$/.test(origin) || /\.ngrok-free\.app$/.test(origin) || /\.ngrok-free\.dev$/.test(origin);

            if (isLocalhost || isLocalIP || isNgrok) {
                return callback(null, true);
            }
        }

        callback(new Error("CORS: Origin not allowed"));
    };
}

function createApp({
  frontendOrigin,
  apiPrefix = process.env.API_PREFIX || "/api",
  staticDir = process.env.STATIC_DIR || null,
  lobbyRoutes = express.Router(),
  playbackRoutes = express.Router(),
  leaderboardRoutes = express.Router()
}) {
  const app = express();
  const isAllowedOrigin = createAllowedOrigins(frontendOrigin);

  app.use(cors({
    origin: isAllowedOrigin,
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

  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json(success({
      service: "blindbeat-backend",
      status: "ok"
    }, req.requestId));
  });
  
  app.use(`${apiPrefix}/lobbies`, lobbyRoutes);
  app.use(`${apiPrefix}/matches`, playbackRoutes);
  app.use(`${apiPrefix}/matches`, leaderboardRoutes);

  if (staticDir) {
    app.use(express.static(staticDir, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      }
    }));

    app.get("*", (req, res, next) => {
      if (req.path.startsWith(apiPrefix)) {
        return next();
      }

      res.sendFile(path.resolve(staticDir, "index.html"));
    });
  }

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

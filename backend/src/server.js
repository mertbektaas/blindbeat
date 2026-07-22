require("dotenv").config();
const gameConfig = require("./config/game.config.js");
const { createPlayerIdentityRegistry } = require("./registries/player-identity.registry");
const { createLobbyService } = require("./services/lobby.service");
const { createLobbyController } = require("./controllers/lobby.controller");
const { createLobbyRoutes } = require("./routes/lobby.routes");
const { createPlayerSessionCookie , readPlayerSessionToken, clearPlayerSessionCookie} = require("./cookies/player-session.cookie");
const { createSessionService } = require("./services/session.service");
const { createServer } = require("node:http");
const { WebSocketServer } = require("ws");
const { createConnectionRegistry } = require("./realtime/connection.registry");
const { createRoomRegistry } = require("./realtime/room.registry");
const { startHeartbeat } = require("./realtime/heartbeat");
const {
  createWebSocketOriginVerifier
} = require("./realtime/origin.verifier");
const {
  createConnectionHandler
} = require("./realtime/connection.handler");
const {
  createLobbyBroadcaster
} = require("./realtime/lobby.broadcaster");

const connectionRegistry = createConnectionRegistry();
const roomRegistry = createRoomRegistry();
const { createApp } = require("./app");
const logger = require("./logger");
const {
  verifyDatabaseConnection,
  disconnectDatabase,
  prisma
} = require("./database");



const identityRegistry = createPlayerIdentityRegistry();

const lobbyBroadcaster = createLobbyBroadcaster({
  prisma,
  roomRegistry,
  connectionRegistry
});

const lobbyService = createLobbyService({ prisma, identityRegistry });

const sessionService = createSessionService({ prisma, identityRegistry });


const lobbyController = createLobbyController({ 
    lobbyService,
    sessionService,
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie,
    identityRegistry,
    lobbyBroadcaster,
    roomRegistry,
    connectionRegistry
});

const lobbyRoutes = createLobbyRoutes({ lobbyController });



const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const app = createApp({ frontendOrigin, lobbyRoutes });

const httpServer = createServer(app);

const webSocketServer = new WebSocketServer({
  server:httpServer,
  path: "/ws",
  verifyClient: createWebSocketOriginVerifier(frontendOrigin)
});

webSocketServer.on("connection", createConnectionHandler({
  readPlayerSessionToken,
  identityRegistry,
  prisma,
  connectionRegistry,
  roomRegistry,
  lobbyBroadcaster
}));

let server;
let stopHeartbeat;

async function start() {
  await verifyDatabaseConnection();

  server = httpServer.listen(port, () => {
    stopHeartbeat = startHeartbeat(webSocketServer);

    logger.info("server_started", {
      port,
      frontendOrigin,
      database: "connected",
      gameConfig: {
        bpm: gameConfig.defaultBpm,
        stepCount: gameConfig.defaultStepCount,
        instrumentRoundSeconds: gameConfig.instrumentRoundSeconds,
        playbackLoops: gameConfig.playbackLoops,
        songVariantCount: gameConfig.songVariantCount,
        minPlayers: gameConfig.minPlayers,
        maxPlayers: gameConfig.maxPlayers,
        maxMatchCount: gameConfig.maxMatchCount
      }
    });
  });
}

async function shutdown(signal) {
  logger.info("server_shutdown_started", { signal });

  if (stopHeartbeat) {
    stopHeartbeat();
  }

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

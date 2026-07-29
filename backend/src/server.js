require("dotenv").config();

// #region Dis kutuphaneler ve Node altyapisi
const { createServer } = require("node:http");
const { WebSocketServer } = require("ws");
// #endregion

// #region Uygulama ayarlari ve ortak altyapi
const gameConfig = require("./config/game.config.js");
const { createApp } = require("./app");
const logger = require("./logger");
const {
  verifyDatabaseConnection,
  disconnectDatabase,
  prisma
} = require("./database");
// #endregion

// #region REST katmani
const { createLobbyService } = require("./services/lobby.service");
const { createSessionService } = require("./services/session.service");
const { createLobbyController } = require("./controllers/lobby.controller");
const { createLobbyRoutes } = require("./routes/lobby.routes");
const { createPlaybackRoutes } = require("./routes/playback.routes");
const { createLeaderboardRoutes } = require("./routes/leaderboard.routes");
const { createPlaybackController } = require("./controllers/playback.controller");
const { createPlaybackService } = require("./services/playback.service");
const { createLeaderboardController } = require("./controllers/leaderboard.controller");
const { createLeaderboardService } = require("./services/leaderboard.service");
const { createVoteService } = require("./services/vote.service");
const { createMatchResultService } = require("./services/match-result.service");
const { createOgRoundService } = require("./services/og-round.service");
const { createOgRoundCoordinator } = require("./services/og-round.coordinator");
const { createNextMatchCoordinator } = require("./services/next-match.coordinator");
const { createSessionResultService } = require("./services/session-result.service");
const {
  createPlayerSessionCookie,
  readPlayerSessionToken,
  clearPlayerSessionCookie
} = require("./cookies/player-session.cookie");
const {
  createPlayerIdentityRegistry
} = require("./registries/player-identity.registry");
// #endregion

// #region WebSocket ve room yonetimi
const { createConnectionRegistry } = require("./realtime/connection.registry");
const { createRequestIdRegistry } = require("./realtime/request-id.registry");
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
const {
  createGameStateBroadcaster
} = require("./realtime/game-state.broadcaster.js");
// #endregion

// #region Oyun runtime yonetimi
const {
  createSessionRuntimeBootstrap
} = require("./game/session.runtime.bootstrap");
const {
  createGameRuntimeRegistry
} = require("./game/runtime.registry");
const {
  createGameStateSnapshot
} = require("./game/game-state.snapshot");
const {
  createPhaseStateMachine
} = require("./game/phase.game-state.machine");
const { 
  createInstrumentRoundManager 
}= require("./game/instrument-round");
const {
  createSessionReadiness
} = require("./game/session-readiness");
const {
  createSessionGameFlow
} = require("./game/session.game-flow.js");
const {
  createPlaybackPhaseManager
} = require("./game/playback-phase.js");
const {
  createPlaybackCompletion
} = require("./game/playback-completion.js");
const {
  createReconnectManager
} = require("./game/reconnect.manager.js");
const {
  createPlaybackReadiness
} = require("./game/playback-readiness.js");
const {
  createPlaybackStartCoordinator
} = require("./game/playback-start.coordinator.js");
const {
  createDraftPatternManager
} = require("./game/draft-pattern.js");
const {
  createRoundCompletion
} = require("./game/round-completion.js");
const {
  createRoundTransition
} = require("./game/round-transition.js");
const {
  createRoundFinalizer
} = require("./game/round-finalizer.js");
const {
  createEmptyPattern
} = require("./game/empty-pattern.factory.js");
const {
  createSongAssemblyService
} = require("./services/song-assembly.service.js");

// #region Bellek ici registryler
const connectionRegistry = createConnectionRegistry();
const requestIdRegistry = createRequestIdRegistry({
  maxEntriesPerPlayer: gameConfig.requestIdHistoryPerPlayer
});
const roomRegistry = createRoomRegistry();
const identityRegistry = createPlayerIdentityRegistry();
const runtimeRegistry = createGameRuntimeRegistry();
// #endregion

const phaseStateMachine = createPhaseStateMachine();
const instrumentRoundManager = createInstrumentRoundManager({ phaseStateMachine });

const sessionReadiness = createSessionReadiness();
const sessionGameFlow = createSessionGameFlow({
  sessionReadiness,
  instrumentRoundManager
});

const playbackReadiness = createPlaybackReadiness();
const playbackCompletion = createPlaybackCompletion({
  phaseStateMachine
});
const playbackStartCoordinator = createPlaybackStartCoordinator({
  connectionRegistry,
  gameConfig
});
const playbackPhaseManager = createPlaybackPhaseManager({
  phaseStateMachine,
  playbackReadiness,
  playbackCompletion
});

const draftPatternManager = createDraftPatternManager();
const reconnectManager = createReconnectManager({
  instrumentRoundSeconds: gameConfig.instrumentRoundSeconds
});

// #endregion

// #region Broadcaster ve runtime bagimliliklari
const lobbyBroadcaster = createLobbyBroadcaster({
  prisma,
  roomRegistry,
  connectionRegistry
});

const gameStateBroadcaster = createGameStateBroadcaster({
  runtimeRegistry,
  connectionRegistry,
  createGameStateSnapshot
});

const sessionRuntimeBootstrap = createSessionRuntimeBootstrap({
  runtimeRegistry
});
// #endregion

// #region Servis ve controller kurulumu
const lobbyService = createLobbyService({ prisma, identityRegistry });

const sessionService = createSessionService({
  prisma,
  identityRegistry,
  sessionRuntimeBootstrap
});

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

const playbackService = createPlaybackService({ prisma });
const playbackController = createPlaybackController({
  playbackService,
  readPlayerSessionToken,
  identityRegistry
});
const playbackRoutes = createPlaybackRoutes({ playbackController });
const { createSessionLeaderboardRepository } = require("./repositories/session-leaderboard.repository");
const sessionLeaderboardRepository = createSessionLeaderboardRepository(prisma);
const leaderboardService = createLeaderboardService({
  prisma,
  sessionLeaderboardRepository
});
const leaderboardController = createLeaderboardController({
  leaderboardService,
  readPlayerSessionToken,
  identityRegistry
});
const leaderboardRoutes = createLeaderboardRoutes({ leaderboardController });
const { createVoteRepository } = require("./repositories/vote.repository");
const voteRepository = createVoteRepository(prisma);
const matchResultService = createMatchResultService({
  prisma,
  runtimeRegistry,
  phaseStateMachine,
  unanimousVoteMultiplier: gameConfig.unanimousVoteMultiplier
});
const voteService = createVoteService({
  voteRepository,
  runtimeRegistry,
  matchResultService
});
// #endregion

// #region Pattern Locking

const { createPatternRepository } = require("./repositories/pattern.repository");
const { createMatchRepository } = require("./repositories/match.repository");

const { createInstrumentRepository } = require("./repositories/instrument.repository");

const { createPatternService } = require("./services/pattern.service");

const { createPatternLockManager } = require("./game/pattern-lock.js");

const patternRepository = createPatternRepository(prisma);
const matchRepository = createMatchRepository(prisma);

const patternService = createPatternService({patternRepository});

const patternLockManager = createPatternLockManager({ patternService });

const roundCompletion = createRoundCompletion();

const roundTransition = createRoundTransition({ phaseStateMachine });

const instrumentRepository = createInstrumentRepository(prisma);

const roundFinalizer = createRoundFinalizer({
  roundCompletion,
  patternLockManager,
  roundTransition,
  createEmptyPattern,
  instrumentRepository
});

const songAssemblyService = createSongAssemblyService({ prisma });

const ogRoundService = createOgRoundService({
  patternRepository,
  sessionLeaderboardRepository
});

const ogRoundCoordinator = createOgRoundCoordinator({
  runtimeRegistry,
  phaseStateMachine,
  ogRoundService,
  matchRepository,
  songAssemblyService,
  playbackPhaseManager
});

const nextMatchCoordinator = createNextMatchCoordinator({
  matchRepository,
  phaseStateMachine
});

const sessionResultService = createSessionResultService({
  prisma,
  runtimeRegistry,
  phaseStateMachine,
  sessionLeaderboardRepository
});

// #endregion

// #region HTTP ve WebSocket server kurulumu
const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const app = createApp({
  frontendOrigin,
  lobbyRoutes,
  playbackRoutes,
  leaderboardRoutes
});

const httpServer = createServer(app);

const webSocketServer = new WebSocketServer({
  server: httpServer,
  path: "/ws",
  maxPayload: gameConfig.websocketMaxPayloadBytes,
  verifyClient: createWebSocketOriginVerifier(frontendOrigin)
});

webSocketServer.on("connection", createConnectionHandler({
  readPlayerSessionToken,
  identityRegistry,
  prisma,
  connectionRegistry,
  roomRegistry,
  lobbyBroadcaster,
  gameStateBroadcaster,
  runtimeRegistry,
  reconnectManager,
  requestIdRegistry,
  sessionGameFlow,
  gameConfig,
  draftPatternManager,
  patternLockManager,
  roundFinalizer,
  instrumentRoundManager,
  songAssemblyService,
  playbackReadiness,
  playbackStartCoordinator,
  playbackPhaseManager,
  playbackCompletion,
  voteService,
  nextMatchCoordinator,
  ogRoundCoordinator,
  sessionResultService
}));
// #endregion

// #region Server yasam dongusu
const { createRoundDeadlineScheduler } = require("./game/round-deadline.scheduler.js");
const { createShutdownHandler } = require("./server.shutdown.js");
let server;
let stopHeartbeat;

const roundDeadlineScheduler = createRoundDeadlineScheduler({
  runtimeRegistry,
  roundFinalizer,
  instrumentRoundManager,
  gameStateBroadcaster,
  gameConfig,
  songAssemblyService,
  playbackPhaseManager
});

async function start() {
  await verifyDatabaseConnection();

  server = httpServer.listen(port, () => {
    stopHeartbeat = startHeartbeat(webSocketServer);

    roundDeadlineScheduler.start();

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

const { shutdown } = createShutdownHandler({
  getServer: () => server,
  getWebSocketServer: () => webSocketServer,
  getStopHeartbeat: () => stopHeartbeat,
  roundDeadlineScheduler,
  disconnectDatabase,
  logger,
  exit: (code) => process.exit(code)
});

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
// #endregion

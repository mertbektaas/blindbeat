const request = require("supertest");
const { LobbyStatus, SessionStatus } = require("@prisma/client");

const { createApp } = require("../../src/app");
const { prisma, disconnectDatabase } = require("../../src/database");
const {
    createPlayerIdentityRegistry
} = require("../../src/registries/player-identity.registry");
const {
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie
} = require("../../src/cookies/player-session.cookie");
const { createLobbyService } = require("../../src/services/lobby.service");
const { createSessionService } = require("../../src/services/session.service");
const {
    createGameRuntimeRegistry
} = require("../../src/game/runtime.registry");
const {
    createSessionRuntimeBootstrap
} = require("../../src/game/session.runtime.bootstrap");
const {
    createRoomRegistry
} = require("../../src/realtime/room.registry");
const {
    createLobbyController
} = require("../../src/controllers/lobby.controller");
const { createLobbyRoutes } = require("../../src/routes/lobby.routes");

const identityRegistry = createPlayerIdentityRegistry();
const lobbyService = createLobbyService({
    prisma,
    identityRegistry
});
const runtimeRegistry = createGameRuntimeRegistry();
const sessionRuntimeBootstrap = createSessionRuntimeBootstrap({
    runtimeRegistry
});
const sessionService = createSessionService({
    prisma,
    identityRegistry,
    sessionRuntimeBootstrap
});
const roomRegistry = createRoomRegistry();
const lobbyController = createLobbyController({
    lobbyService,
    sessionService,
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie,
    identityRegistry,
    roomRegistry
});
const lobbyRoutes = createLobbyRoutes({ lobbyController });
const app = createApp({
    frontendOrigin: "http://localhost:5173",
    lobbyRoutes
});

const createdLobbyIds = [];

function getSessionCookie(response) {
    return response.headers["set-cookie"];
}

async function createLobby(nickname) {
    const response = await request(app)
        .post("/lobbies")
        .send({ nickname });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const lobby = response.body.data.lobby;
    createdLobbyIds.push(lobby.id);

    return {
        lobby,
        cookie: getSessionCookie(response)
    };
}

async function joinLobby(lobbyCode, nickname) {
    const response = await request(app)
        .post(`/lobbies/${lobbyCode}/join`)
        .send({ nickname });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    return {
        lobby: response.body.data.lobby,
        player: response.body.data.player,
        cookie: getSessionCookie(response)
    };
}

afterAll(async () => {
    for (const lobbyId of createdLobbyIds) {
        await prisma.lobby.delete({
            where: {
                id: lobbyId
            }
        });
    }

    await disconnectDatabase();
});

test("REST akisi lobby olusturur, player ekler ve player cikartir", async () => {
    const suffix = Date.now();
    const created = await createLobby(`rest-owner-${suffix}`);
    const joined = await joinLobby(
        created.lobby.code,
        `rest-guest-${suffix}`
    );

    expect(joined.lobby.players).toHaveLength(2);

    const leaveResponse = await request(app)
        .delete(`/lobbies/${created.lobby.code}/players/me`)
        .set("Cookie", joined.cookie);

    expect(leaveResponse.status).toBe(200);
    expect(leaveResponse.body.success).toBe(true);
    expect(leaveResponse.body.data.lobbyDeleted).toBe(false);
    expect(leaveResponse.body.data.lobby.players).toHaveLength(1);
    expect(leaveResponse.body.data.lobby.players[0].nickname)
        .toBe(`rest-owner-${suffix}`);
    expect(leaveResponse.headers["set-cookie"]).toBeDefined();
});

test("REST akisi dort oyuncuyla session baslatir", async () => {
    const suffix = Date.now();
    const created = await createLobby(`session-owner-${suffix}`);
    let lastJoined;

    for (const label of ["a", "b", "c"]) {
        lastJoined = await joinLobby(
            created.lobby.code,
            `session-player-${label}-${suffix}`
        );
    }

    const response = await request(app)
        .post(`/lobbies/${created.lobby.code}/sessions`)
        .set("Cookie", lastJoined.cookie)
        .send({
            maxMatchCount: 5,
            bpm: 120,
            stepCount: 8,
            instrumentRoundSeconds: 30,
            playbackLoops: 5,
            songVariantCount: 3,
            instrumentCodes: ["kick", "bass"]
        });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.lobby.status).toBe(LobbyStatus.IN_SESSION);
    expect(response.body.data.session.status).toBe(SessionStatus.RUNNING);
    expect(response.body.data.sessionInstruments).toEqual([
        { instrumentId: 1, orderNo: 1 },
        { instrumentId: 4, orderNo: 2 }
    ]);
    expect(response.body.data.config.instrumentCodes)
        .toEqual(["kick", "bass"]);

    const reconnectResponse = await request(app)
        .post(`/lobbies/${created.lobby.code}/join`)
        .set("Cookie", lastJoined.cookie)
        .send({
            nickname: lastJoined.player.nickname
        });

    expect(reconnectResponse.status).toBe(200);
    expect(reconnectResponse.body.success).toBe(true);
    expect(reconnectResponse.body.data.reconnected).toBe(true);
    expect(reconnectResponse.body.data.lobby.players).toHaveLength(4);
});

test("REST duplicate nickname icin 409 doner", async () => {
    const suffix = Date.now();
    const nickname = `duplicate-${suffix}`;
    const created = await createLobby(nickname);

    const response = await request(app)
        .post(`/lobbies/${created.lobby.code}/join`)
        .send({ nickname });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("NICKNAME_TAKEN");
});

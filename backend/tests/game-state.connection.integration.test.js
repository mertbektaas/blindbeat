const { createServer } = require("node:http");
const {
    WebSocketServer,
    WebSocket
} = require("ws");
const {
    createPlayerIdentityRegistry
} = require("../src/registries/player-identity.registry");
const {
    readPlayerSessionToken,
    createPlayerSessionCookie
} = require("../src/cookies/player-session.cookie");
const {
    createConnectionRegistry
} = require("../src/realtime/connection.registry");
const {
    createRoomRegistry
} = require("../src/realtime/room.registry");
const {
    createConnectionHandler
} = require("../src/realtime/connection.handler");
const {
    createLobbyBroadcaster
} = require("../src/realtime/lobby.broadcaster");
const {
    createGameRuntimeRegistry
} = require("../src/game/runtime.registry");
const {
    createGameStateSnapshot
} = require("../src/game/game-state.snapshot");
const {
    createGameStateBroadcaster
} = require("../src/realtime/game-state.broadcaster");
const {
    createRequestIdRegistry
} = require("../src/realtime/request-id.registry");
const {
    createPhaseStateMachine
} = require("../src/game/phase.game-state.machine");
const {
    createInstrumentRoundManager
} = require("../src/game/instrument-round");
const {
    createSessionReadiness
} = require("../src/game/session-readiness");
const {
    createSessionGameFlow
} = require("../src/game/session.game-flow");
const {
    createDraftPatternManager
} = require("../src/game/draft-pattern");
const {
    createWebSocketOriginVerifier
} = require("../src/realtime/origin.verifier");

const allowedOrigin = "http://localhost:5173";

function waitForMessages(socket, count) {
    return new Promise((resolve, reject) => {
        const messages = [];

        socket.on("message", (message) => {
            messages.push(JSON.parse(message.toString()));

            if (messages.length === count) {
                resolve(messages);
            }
        });

        socket.on("error", reject);
    });
}

function waitForMessageType(socket, expectedType) {
    return new Promise((resolve, reject) => {
        const handleMessage = (message) => {
            const parsedMessage = JSON.parse(message.toString());

            if (parsedMessage.type !== expectedType) {
                return;
            }

            socket.off("message", handleMessage);
            socket.off("error", handleError);
            resolve(parsedMessage);
        };

        const handleError = (error) => {
            socket.off("message", handleMessage);
            socket.off("error", handleError);
            reject(error);
        };

        socket.on("message", handleMessage);
        socket.on("error", handleError);
    });
}

function waitForNoMessageType(socket, unexpectedType, durationMs = 100) {
    return new Promise((resolve, reject) => {
        const handleMessage = (message) => {
            const parsedMessage = JSON.parse(message.toString());

            if (parsedMessage.type === unexpectedType) {
                clearTimeout(timeout);
                socket.off("message", handleMessage);
                reject(new Error(`${unexpectedType} mesaji beklenmedik sekilde gonderildi.`));
            }
        };

        const timeout = setTimeout(() => {
            socket.off("message", handleMessage);
            resolve();
        }, durationMs);

        socket.on("message", handleMessage);
    });
}

function waitForClose(socket) {
    return new Promise((resolve, reject) => {
        socket.once("close", (code) => {
            resolve(code);
        });

        socket.once("error", reject);
    });
}

describe("Game state WebSocket akisi", () => {
    let httpServer;
    let webSocketServer;
    let port;
    let cookie;
    let secondCookie;
    let identityRegistry;

    beforeAll(async () => {
        identityRegistry = createPlayerIdentityRegistry();
        const identity = identityRegistry.create({
            playerId: 24,
            lobbyId: 16,
            nickname: "Mert"
        });

        const secondIdentity = identityRegistry.create({
            playerId: 25,
            lobbyId: 16,
            nickname: "Ali"
        });

        cookie = createPlayerSessionCookie(identity.token);
        secondCookie = createPlayerSessionCookie(secondIdentity.token);

        const prisma = {
            lobby: {
                findUnique: jest.fn().mockResolvedValue({
                    code: "ABCD",
                    status: "IN_SESSION",
                    players: [
                        {
                            id: 24,
                            nickname: "Mert"
                        },
                        {
                            id: 25,
                            nickname: "Ali"
                        }
                    ]
                })
            }
        };

        const connectionRegistry = createConnectionRegistry();
        const requestIdRegistry = createRequestIdRegistry();
        const roomRegistry = createRoomRegistry();
        const runtimeRegistry = createGameRuntimeRegistry();
        const runtime = runtimeRegistry.getOrCreateRuntime({
            sessionId: 77,
            playerIds: [24, 25],
            sessionInstrumentIds: [4]
        });

        runtime.players.get(24).draftPattern = {
            steps: [true, false]
        };

        roomRegistry.setActiveSession({
            lobbyId: 16,
            lobbyCode: "ABCD",
            sessionId: 77
        });

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
        const phaseStateMachine = createPhaseStateMachine();
        const instrumentRoundManager = createInstrumentRoundManager({
            phaseStateMachine
        });
        const sessionReadiness = createSessionReadiness();
        const sessionGameFlow = createSessionGameFlow({
            sessionReadiness,
            instrumentRoundManager
        });
        const draftPatternManager = createDraftPatternManager();

        httpServer = createServer((request, response) => {
            response.writeHead(404);
            response.end();
        });

        webSocketServer = new WebSocketServer({
            server: httpServer,
            path: "/ws",
            verifyClient: createWebSocketOriginVerifier(allowedOrigin)
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
            requestIdRegistry,
            sessionGameFlow,
            gameConfig: {
                instrumentRoundSeconds: 30
            },
            draftPatternManager
        }));

        await new Promise((resolve) => {
            httpServer.listen(0, resolve);
        });

        port = httpServer.address().port;
    });

    afterAll(async () => {
        await new Promise((resolve, reject) => {
            webSocketServer.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });

        await new Promise((resolve) => {
            httpServer.close(resolve);
        });
    });

    test("aktif session varsa baglantida game snapshot gonderir", async () => {
        const socket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: allowedOrigin
            }
        );

        const messages = await waitForMessages(socket, 3);
        const gameStateMessage = messages.find(
            (message) => message.type === "game:state"
        );

        expect(gameStateMessage).toBeDefined();
        expect(gameStateMessage.payload.sessionId).toBe(77);
        expect(gameStateMessage.payload.myDraftPattern).toEqual({
            steps: [true, false]
        });

        socket.close();
        await waitForClose(socket);
    });

    test("game state isteginde aktif session snapshotini doner", async () => {
        const socket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: allowedOrigin
            }
        );

        await waitForMessages(socket, 3);

        const responsePromise = waitForMessages(socket, 1);

        socket.send(JSON.stringify({
            type: "game:request-state"
        }));

        const response = await responsePromise;

        expect(response[0].type).toBe("game:state");
        expect(response[0].payload.sessionId).toBe(77);
        expect(response[0].payload.myDraftPattern).toEqual({
            steps: [true, false]
        });

        socket.close();
        await waitForClose(socket);
    });

    test("tum oyuncular hazir oldugunda instrument round baslar", async () => {
        const firstSocket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: allowedOrigin
            }
        );

        const secondSocket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: secondCookie
                },
                origin: allowedOrigin
            }
        );

        await Promise.all([
            waitForMessageType(firstSocket, "game:state"),
            waitForMessageType(firstSocket, "connection:ready"),
            waitForMessageType(firstSocket, "lobby:snapshot"),
            waitForMessageType(secondSocket, "game:state"),
            waitForMessageType(secondSocket, "connection:ready"),
            waitForMessageType(secondSocket, "lobby:snapshot")
        ]);

        const firstReadyState = waitForMessageType(firstSocket, "game:state");
        const secondReadyState = waitForMessageType(secondSocket, "game:state");

        firstSocket.send(JSON.stringify({
            type: "game:player-ready"
        }));

        const firstReadyMessage = await firstReadyState;
        const secondReadyMessage = await secondReadyState;

        expect(firstReadyMessage.payload.phase).toBe("MATCH_STARTING");
        expect(secondReadyMessage.payload.phase).toBe("MATCH_STARTING");
        expect(
            firstReadyMessage.payload.players.find(
                (player) => player.playerId === 24
            ).ready
        ).toBe(true);

        const firstRoundState = waitForMessageType(firstSocket, "game:state");
        const secondRoundState = waitForMessageType(secondSocket, "game:state");

        secondSocket.send(JSON.stringify({
            type: "game:player-ready"
        }));

        const firstRoundMessage = await firstRoundState;
        const secondRoundMessage = await secondRoundState;

        expect(firstRoundMessage.payload.phase).toBe("INSTRUMENT_ROUND");
        expect(secondRoundMessage.payload.phase).toBe("INSTRUMENT_ROUND");
        expect(firstRoundMessage.payload.currentInstrumentId).toBe(4);
        expect(firstRoundMessage.payload.deadlineAt).not.toBeNull();

        firstSocket.close();
        secondSocket.close();
        await Promise.all([
            waitForClose(firstSocket),
            waitForClose(secondSocket)
        ]);
    });

    test("oyuncunun draft guncellemesi herkese state olarak yayinlanir", async () => {
        const firstSocket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: allowedOrigin
            }
        );

        const secondSocket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: secondCookie
                },
                origin: allowedOrigin
            }
        );

        await Promise.all([
            waitForMessageType(firstSocket, "game:state"),
            waitForMessageType(firstSocket, "connection:ready"),
            waitForMessageType(firstSocket, "lobby:snapshot"),
            waitForMessageType(secondSocket, "game:state"),
            waitForMessageType(secondSocket, "connection:ready"),
            waitForMessageType(secondSocket, "lobby:snapshot")
        ]);

        const draftPattern = {
            steps: [
                { kick: true },
                { kick: false }
            ]
        };

        const firstState = waitForMessageType(firstSocket, "game:state");
        const secondState = waitForNoMessageType(secondSocket, "game:state");

        firstSocket.send(JSON.stringify({
            type: "pattern:draft-update",
            payload: {
                patternData: draftPattern
            }
        }));

        const firstMessage = await firstState;
        await secondState;

        expect(firstMessage.payload.myDraftPattern).toEqual(draftPattern);

        firstSocket.close();
        secondSocket.close();
        await Promise.all([
            waitForClose(firstSocket),
            waitForClose(secondSocket)
        ]);
    });

    test("ayni requestId ikinci kez gelirse islem tekrarlanmaz", async () => {
        const socket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: allowedOrigin
            }
        );

        await waitForMessages(socket, 3);

        const firstState = waitForMessageType(socket, "game:state");
        socket.send(JSON.stringify({
            type: "pattern:draft-update",
            requestId: "duplicate-draft-request",
            payload: {
                patternData: {
                    steps: [true]
                }
            }
        }));
        await firstState;

        const duplicateError = waitForMessageType(socket, "error");
        socket.send(JSON.stringify({
            type: "pattern:draft-update",
            requestId: "duplicate-draft-request",
            payload: {
                patternData: {
                    steps: [false]
                }
            }
        }));

        const errorMessage = await duplicateError;

        expect(errorMessage.payload.code).toBe("DUPLICATE_REQUEST");

        socket.close();
        await waitForClose(socket);
    });
});

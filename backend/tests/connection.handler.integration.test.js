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

function waitForClose(socket) {
    return new Promise((resolve, reject) => {
        socket.once("close", (code, reason) => {
            resolve({
                code,
                reason: reason.toString()
            });
        });

        socket.once("error", reject);
    });
}

describe("WebSocket handshake", () => {
    let httpServer;
    let webSocketServer;
    let port;
    let cookie;
    let identityRegistry;

    beforeAll(async () => {
        identityRegistry = createPlayerIdentityRegistry();
        const identity = identityRegistry.create({
            playerId: 24,
            lobbyId: 16,
            nickname: "Mert"
        });

        cookie = createPlayerSessionCookie(identity.token);

        const prisma = {
            lobby: {
                findUnique: jest.fn().mockResolvedValue({
                    code: "ABCD",
                    status: "OPEN",
                    players: [
                        {
                            id: 24,
                            nickname: "Mert"
                        }
                    ]
                })
            }
        };

        const connectionRegistry = createConnectionRegistry();
        const roomRegistry = createRoomRegistry();
        const lobbyBroadcaster = createLobbyBroadcaster({
            prisma,
            roomRegistry,
            connectionRegistry
        });

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
            lobbyBroadcaster
        }));

        await new Promise((resolve) => {
            httpServer.listen(0, resolve);
        });

        port = httpServer.address().port;
    });

    afterAll(async () => {
        webSocketServer.close();

        await new Promise((resolve) => {
            httpServer.close(resolve);
        });
    });

    test("geçerli cookie ve Origin ile bağlantı kurup snapshot alır", async () => {
        const socket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: allowedOrigin
            }
        );

        const messages = await waitForMessages(socket, 2);

        expect(messages[0].type).toBe("connection:ready");
        expect(messages[1].type).toBe("lobby:snapshot");
        expect(messages[1].payload.players).toEqual([
            {
                nickname: "Mert",
                online: true
            }
        ]);

        const requestedSnapshotPromise = waitForMessages(socket, 1);

        socket.send(JSON.stringify({
            type: "lobby:request-snapshot"
        }));

        const requestedSnapshot = await requestedSnapshotPromise;

        expect(requestedSnapshot[0].type).toBe("lobby:snapshot");
        expect(requestedSnapshot[0].stateVersion).toBe(1);

        socket.close();
        await waitForClose(socket);
    });

    test("geçersiz cookie bağlantıyı kapatır", async () => {
        const socket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: "blindbeat_player_session=invalid"
                },
                origin: allowedOrigin
            }
        );

        const closed = await waitForClose(socket);

        expect(closed.code).toBe(1008);
    });

    test("geçersiz Origin handshake aşamasında reddedilir", async () => {
        const socket = new WebSocket(
            `ws://127.0.0.1:${port}/ws`,
            {
                headers: {
                    Cookie: cookie
                },
                origin: "http://kotu-site.example"
            }
        );

        const result = await new Promise((resolve) => {
            socket.once("unexpected-response", (request, response) => {
                resolve(response.statusCode);
            });

            socket.once("error", () => {
                resolve(null);
            });
        });

        expect(result).toBe(401);
    });
});

const {
    createLobbyBroadcaster
} = require("../src/realtime/lobby.broadcaster");
const {
    createConnectionRegistry
} = require("../src/realtime/connection.registry");
const {
    createRoomRegistry
} = require("../src/realtime/room.registry");

describe("LobbyBroadcaster", () => {
    test("online oyunculara lobby eventini gönderir", async () => {
        const socket = {
            readyState: 1,
            send: jest.fn()
        };
        const connectionRegistry = createConnectionRegistry();
        const roomRegistry = createRoomRegistry();

        connectionRegistry.add(24, socket);
        roomRegistry.addPlayer(16, "ABCD", 24);

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

        const broadcaster = createLobbyBroadcaster({
            prisma,
            roomRegistry,
            connectionRegistry
        });

        const result = await broadcaster.broadcastLobbyEvent({
            lobbyId: 16,
            type: "lobby:player-joined",
            changedPlayer: {
                nickname: "Ali",
                action: "joined"
            }
        });

        expect(result.sentCount).toBe(1);

        const message = JSON.parse(socket.send.mock.calls[0][0]);

        expect(message.type).toBe("lobby:player-joined");
        expect(message.stateVersion).toBe(1);
        expect(message.payload.players).toEqual([
            {
                nickname: "Mert",
                online: true
            }
        ]);
        expect(message.payload.changedPlayer).toEqual({
            nickname: "Ali",
            action: "joined"
        });
    });

    test("room yoksa mesaj göndermeden güvenli şekilde döner", async () => {
        const prisma = {
            lobby: {
                findUnique: jest.fn()
            }
        };

        const broadcaster = createLobbyBroadcaster({
            prisma,
            roomRegistry: createRoomRegistry(),
            connectionRegistry: createConnectionRegistry()
        });

        const result = await broadcaster.broadcastLobbyEvent({
            lobbyId: 16,
            type: "lobby:player-left",
            changedPlayer: {
                nickname: "Ali",
                action: "left"
            }
        });

        expect(result.sentCount).toBe(0);
        expect(prisma.lobby.findUnique).not.toHaveBeenCalled();
    });

    test("tek oyuncuya güncel snapshot gönderebilir", async () => {
        const socket = {
            readyState: 1,
            send: jest.fn()
        };
        const connectionRegistry = createConnectionRegistry();
        const roomRegistry = createRoomRegistry();

        connectionRegistry.add(24, socket);
        roomRegistry.addPlayer(16, "ABCD", 24);

        const broadcaster = createLobbyBroadcaster({
            prisma: {
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
            },
            roomRegistry,
            connectionRegistry
        });

        const result = await broadcaster.sendLobbySnapshot({
            lobbyId: 16,
            playerId: 24
        });

        expect(result.sent).toBe(true);
        expect(JSON.parse(socket.send.mock.calls[0][0])).toMatchObject({
            type: "lobby:snapshot",
            stateVersion: 0
        });
    });
});

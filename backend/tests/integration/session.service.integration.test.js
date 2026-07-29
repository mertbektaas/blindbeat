const {
    LobbyStatus,
    SessionStatus
} = require("@prisma/client");

const {
    prisma,
    disconnectDatabase
} = require("../../src/database");

const {
    createSessionService
} = require("../../src/services/session.service");

const {
    createGameRuntimeRegistry
} = require("../../src/game/runtime.registry");

const {
    createSessionRuntimeBootstrap
} = require("../../src/game/session.runtime.bootstrap");

const runtimeRegistry = createGameRuntimeRegistry();
const sessionRuntimeBootstrap = createSessionRuntimeBootstrap({
    runtimeRegistry
});

const service = createSessionService({
    prisma,
    sessionRuntimeBootstrap
});

const validConfig = {
    maxMatchCount: 5,
    bpm: 120,
    stepCount: 8,
    instrumentRoundSeconds: 30,
    playbackLoops: 5,
    songVariantCount: 3,
    instrumentCodes: ["kick", "bass"]
};

const createdLobbyIds = [];

async function createLobbyFixture(playerCount = 4) {
    const suffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const lobby = await prisma.lobby.create({
        data: {
            code: `service-test-${suffix}`,
            status: LobbyStatus.OPEN
        }
    });

    createdLobbyIds.push(lobby.id);

    const players = [];

    for (let index = 0; index < playerCount; index += 1) {
        const player = await prisma.player.create({
            data: {
                nickname: `service-player-${suffix}-${index}`,
                lobbyId: lobby.id
            }
        });

        players.push(player);
    }

    return {
        lobby,
        players
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

test("service gercek PostgreSQL uzerinde session ve iliskilerini olusturur", async () => {
    const { lobby, players } = await createLobbyFixture();

    const result = await service.startSession({
        lobbyCode: lobby.code,
        identity: {
            playerId: players[0].id,
            lobbyId: lobby.id,
            nickname: players[0].nickname
        },
        config: validConfig
    });

    const storedSession = await prisma.session.findUnique({
        where: {
            id: result.session.id
        },
        include: {
            sessionInstruments: {
                include: {
                    instrument: true
                },
                orderBy: {
                    orderNo: "asc"
                }
            },
            players: true,
            leaderboard: true
        }
    });

    const storedLobby = await prisma.lobby.findUnique({
        where: {
            id: lobby.id
        }
    });

    expect(storedSession).not.toBeNull();
    expect(storedSession.lobbyId).toBe(lobby.id);
    expect(storedSession.status).toBe(SessionStatus.RUNNING);
    expect(storedSession.bpm).toBe(120);
    expect(storedSession.stepCount).toBe(8);
    expect(storedSession.maxMatchCount).toBe(5);
    expect(storedSession.instrumentRoundSeconds).toBe(30);
    expect(storedSession.playbackLoops).toBe(5);
    expect(storedSession.songVariantCount).toBe(3);

    expect(storedSession.sessionInstruments).toHaveLength(2);
    expect(storedSession.sessionInstruments[0].orderNo).toBe(1);
    expect(storedSession.sessionInstruments[0].instrument.code).toBe("kick");
    expect(storedSession.sessionInstruments[1].orderNo).toBe(2);
    expect(storedSession.sessionInstruments[1].instrument.code).toBe("bass");

    expect(storedSession.players).toHaveLength(4);
    expect(storedSession.leaderboard).toHaveLength(4);
    expect(storedSession.leaderboard.every(entry => entry.totalScore === 0)).toBe(true);
    expect(storedLobby.status).toBe(LobbyStatus.IN_SESSION);
});

test("gecersiz identity ile session baslatilamaz", async () => {
    const { lobby, players } = await createLobbyFixture();

    await expect(
        service.startSession({
            lobbyCode: lobby.code,
            identity: {
                playerId: 999999,
                lobbyId: lobby.id,
                nickname: players[0].nickname
            },
            config: validConfig
        })
    ).rejects.toMatchObject({
        code: "IDENTITY_NOT_FOUND",
        statusCode: 401
    });

    const sessionCount = await prisma.session.count({
        where: {
            lobbyId: lobby.id
        }
    });

    const storedLobby = await prisma.lobby.findUnique({
        where: {
            id: lobby.id
        }
    });

    expect(sessionCount).toBe(0);
    expect(storedLobby.status).toBe(LobbyStatus.OPEN);
});

test("minimum oyuncu sayisi saglanmadan session baslatilamaz", async () => {
    const { lobby, players } = await createLobbyFixture(3);

    await expect(
        service.startSession({
            lobbyCode: lobby.code,
            identity: {
                playerId: players[0].id,
                lobbyId: lobby.id,
                nickname: players[0].nickname
            },
            config: validConfig
        })
    ).rejects.toMatchObject({
        code: "MIN_PLAYERS_NOT_REACHED",
        statusCode: 409
    });

    const sessionCount = await prisma.session.count({
        where: {
            lobbyId: lobby.id
        }
    });

    expect(sessionCount).toBe(0);
});

test("seed edilmemis veya pasif instrument ile session baslatilamaz", async () => {
    const { lobby, players } = await createLobbyFixture();

    await expect(
        service.startSession({
            lobbyCode: lobby.code,
            identity: {
                playerId: players[0].id,
                lobbyId: lobby.id,
                nickname: players[0].nickname
            },
            config: {
                ...validConfig,
                instrumentCodes: ["does-not-exist"]
            }
        })
    ).rejects.toMatchObject({
        code: "INSTRUMENT_NOT_AVAILABLE",
        statusCode: 400
    });

    const sessionCount = await prisma.session.count({
        where: {
            lobbyId: lobby.id
        }
    });

    expect(sessionCount).toBe(0);
});

test("IN_SESSION durumundaki lobby yeni session baslatamaz", async () => {
    const { lobby, players } = await createLobbyFixture();

    await prisma.lobby.update({
        where: {
            id: lobby.id
        },
        data: {
            status: LobbyStatus.IN_SESSION
        }
    });

    await expect(
        service.startSession({
            lobbyCode: lobby.code,
            identity: {
                playerId: players[0].id,
                lobbyId: lobby.id,
                nickname: players[0].nickname
            },
            config: validConfig
        })
    ).rejects.toMatchObject({
        code: "LOBBY_LOCKED",
        statusCode: 409
    });

    const sessionCount = await prisma.session.count({
        where: {
            lobbyId: lobby.id
        }
    });

    expect(sessionCount).toBe(0);
});

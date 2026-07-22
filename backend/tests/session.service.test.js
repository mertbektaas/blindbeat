const {
    createSessionService
} = require("../src/services/session.service");

function createTestContext({
    lobby = {
        id: 10,
        code: "ABCD",
        status: "OPEN",
        players: [
            { id: 1, nickname: "Mert" },
            { id: 2, nickname: "Ali" },
            { id: 3, nickname: "Ayse" },
            { id: 4, nickname: "Can" }
        ]
    },
    instrumentsByCode = {
        kick: { id: 20, code: "kick", enabled: true },
        bass: { id: 21, code: "bass", enabled: true }
    },
    sessionCreateError,
    sessionInstrumentCreateError,
    sessionPlayerCreateError,
    leaderboardCreateError
} = {}) {
    const updatedLobby = {
        ...lobby,
        status: "IN_SESSION"
    };

    const tx = {
        lobby: {
            findUnique: jest.fn().mockResolvedValue(lobby),
            update: jest.fn().mockResolvedValue(updatedLobby)
        },
        instrument: {
            findUnique: jest.fn(({ where }) =>
                Promise.resolve(instrumentsByCode[where.code] || null)
            )
        },
        session: {
            create: sessionCreateError
                ? jest.fn().mockRejectedValue(sessionCreateError)
                : jest.fn().mockResolvedValue({
                    id: 100,
                    lobbyId: lobby?.id,
                    status: "RUNNING"
                })
        },
        sessionInstrument: {
            createMany: sessionInstrumentCreateError
                ? jest.fn().mockRejectedValue(sessionInstrumentCreateError)
                : jest.fn().mockResolvedValue({ count: 2 })
        },
        sessionPlayer: {
            createMany: sessionPlayerCreateError
                ? jest.fn().mockRejectedValue(sessionPlayerCreateError)
                : jest.fn().mockResolvedValue({ count: lobby?.players.length })
        },
        sessionLeaderboard: {
            createMany: leaderboardCreateError
                ? jest.fn().mockRejectedValue(leaderboardCreateError)
                : jest.fn().mockResolvedValue({ count: lobby?.players.length })
        }
    };

    const prisma = {
        $transaction: jest.fn(async callback => callback(tx))
    };

    const service = createSessionService({
        prisma,
        identityRegistry: {}
    });

    return {
        service,
        prisma,
        tx,
        updatedLobby
    };
}

const validConfig = {
    maxMatchCount: 5,
    bpm: 120,
    stepCount: 8,
    instrumentRoundSeconds: 30,
    playbackLoops: 5,
    songVariantCount: 3,
    instrumentCodes: ["kick", "bass"]
};

const validIdentity = {
    playerId: 1,
    lobbyId: 10,
    nickname: "Mert"
};

describe("SessionService", () => {
    test("gecerli session snapshot ve iliskileri olusturur", async () => {
        const { service, prisma, tx, updatedLobby } = createTestContext();

        const result = await service.startSession({
            lobbyCode: "ABCD",
            identity: validIdentity,
            config: validConfig
        });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(tx.lobby.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { status: "IN_SESSION" }
        });
        expect(tx.session.create).toHaveBeenCalledWith({
            data: {
                lobbyId: 10,
                maxMatchCount: 5,
                bpm: 120,
                stepCount: 8,
                instrumentRoundSeconds: 30,
                playbackLoops: 5,
                songVariantCount: 3,
                status: "RUNNING"
            }
        });
        expect(tx.sessionInstrument.createMany).toHaveBeenCalledWith({
            data: [
                { sessionId: 100, instrumentId: 20, orderNo: 1 },
                { sessionId: 100, instrumentId: 21, orderNo: 2 }
            ]
        });
        expect(tx.sessionPlayer.createMany).toHaveBeenCalledWith({
            data: [
                { sessionId: 100, playerId: 1 },
                { sessionId: 100, playerId: 2 },
                { sessionId: 100, playerId: 3 },
                { sessionId: 100, playerId: 4 }
            ]
        });
        expect(tx.sessionLeaderboard.createMany).toHaveBeenCalledWith({
            data: [
                { sessionId: 100, playerId: 1, totalScore: 0 },
                { sessionId: 100, playerId: 2, totalScore: 0 },
                { sessionId: 100, playerId: 3, totalScore: 0 },
                { sessionId: 100, playerId: 4, totalScore: 0 }
            ]
        });
        expect(result.lobby).toEqual(updatedLobby);
        expect(result.session.id).toBe(100);
    });

    test("lobby bulunamazsa session olusturmaz", async () => {
        const { service, tx } = createTestContext({
            lobby: null
        });

        await expect(
            service.startSession({
                lobbyCode: "YOK1",
                identity: validIdentity,
                config: validConfig
            })
        ).rejects.toMatchObject({
            code: "LOBBY_NOT_FOUND",
            statusCode: 404
        });

        expect(tx.session.create).not.toHaveBeenCalled();
    });

    test("identity lobby oyuncusu degilse session olusturmaz", async () => {
        const { service, tx } = createTestContext();

        await expect(
            service.startSession({
                lobbyCode: "ABCD",
                identity: {
                    ...validIdentity,
                    playerId: 99
                },
                config: validConfig
            })
        ).rejects.toMatchObject({
            code: "IDENTITY_NOT_FOUND",
            statusCode: 401
        });

        expect(tx.session.create).not.toHaveBeenCalled();
    });

    test("minimum oyuncu sayisi saglanmazsa session olusturmaz", async () => {
        const { service, tx } = createTestContext({
            lobby: {
                id: 10,
                code: "ABCD",
                status: "OPEN",
                players: [
                    { id: 1, nickname: "Mert" },
                    { id: 2, nickname: "Ali" },
                    { id: 3, nickname: "Ayse" }
                ]
            }
        });

        await expect(
            service.startSession({
                lobbyCode: "ABCD",
                identity: validIdentity,
                config: validConfig
            })
        ).rejects.toMatchObject({
            code: "MIN_PLAYERS_NOT_REACHED",
            statusCode: 409
        });

        expect(tx.session.create).not.toHaveBeenCalled();
    });

    test("kullanilamayan instrument varsa session olusturmaz", async () => {
        const { service, tx } = createTestContext({
            instrumentsByCode: {
                kick: { id: 20, code: "kick", enabled: true }
            }
        });

        await expect(
            service.startSession({
                lobbyCode: "ABCD",
                identity: validIdentity,
                config: validConfig
            })
        ).rejects.toMatchObject({
            code: "INSTRUMENT_NOT_AVAILABLE",
            statusCode: 400
        });

        expect(tx.session.create).not.toHaveBeenCalled();
    });

    test("transaction icindeki database hatasini disariya tasir", async () => {
        const databaseError = new Error("leaderboard create failed");
        const { service, prisma } = createTestContext({
            leaderboardCreateError: databaseError
        });

        await expect(
            service.startSession({
                lobbyCode: "ABCD",
                identity: validIdentity,
                config: validConfig
            })
        ).rejects.toBe(databaseError);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
});

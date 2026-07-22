const {
    createSessionPlayerRepository
} = require("../src/repositories/session-player.repository");

describe("SessionPlayerRepository", () => {
    test("sessiona birden fazla player ekler", async () => {
        const fakeCreateManyResult = {
            count: 3
        };

        const prisma = {
            sessionPlayer: {
                createMany: jest.fn().mockResolvedValue(fakeCreateManyResult)
            }
        };

        const repository = createSessionPlayerRepository(prisma);

        const result = await repository.createMany({
            sessionId: 1,
            playerIds: [10, 11, 12]
        });

        expect(prisma.sessionPlayer.createMany).toHaveBeenCalledWith({
            data: [
                {
                    sessionId: 1,
                    playerId: 10
                },
                {
                    sessionId: 1,
                    playerId: 11
                },
                {
                    sessionId: 1,
                    playerId: 12
                }
            ]
        });

        expect(result).toEqual(fakeCreateManyResult);
    });

    test("session oyuncularini player iliskisiyle sirali getirir", async () => {
        const fakeSessionPlayers = [
            {
                sessionId: 1,
                playerId: 10,
                player: {
                    nickname: "mert"
                }
            },
            {
                sessionId: 1,
                playerId: 11,
                player: {
                    nickname: "ali"
                }
            }
        ];

        const prisma = {
            sessionPlayer: {
                findMany: jest.fn().mockResolvedValue(fakeSessionPlayers)
            }
        };

        const repository = createSessionPlayerRepository(prisma);

        const result = await repository.findBySessionId(1);

        expect(prisma.sessionPlayer.findMany).toHaveBeenCalledWith({
            where: {
                sessionId: 1
            },
            include: {
                player: true
            },
            orderBy: {
                joinedAt: "asc"
            }
        });

        expect(result).toEqual(fakeSessionPlayers);
    });

    test("session ve player eslesmesini composite key ile bulur", async () => {
        const fakeSessionPlayer = {
            sessionId: 1,
            playerId: 10
        };

        const prisma = {
            sessionPlayer: {
                findUnique: jest.fn().mockResolvedValue(fakeSessionPlayer)
            }
        };

        const repository = createSessionPlayerRepository(prisma);

        const result = await repository.findBySessionAndPlayer({
            sessionId: 1,
            playerId: 10
        });

        expect(prisma.sessionPlayer.findUnique).toHaveBeenCalledWith({
            where: {
                sessionId_playerId: {
                    sessionId: 1,
                    playerId: 10
                }
            }
        });

        expect(result).toEqual(fakeSessionPlayer);
    });

    test("sessiondaki player sayisini getirir", async () => {
        const prisma = {
            sessionPlayer: {
                count: jest.fn().mockResolvedValue(4)
            }
        };

        const repository = createSessionPlayerRepository(prisma);

        const result = await repository.countBySessionId(1);

        expect(prisma.sessionPlayer.count).toHaveBeenCalledWith({
            where: {
                sessionId: 1
            }
        });

        expect(result).toBe(4);
    });
});

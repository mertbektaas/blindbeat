const {
    createSessionLeaderboardRepository
} = require("../src/repositories/session-leaderboard.repository");

describe("SessionLeaderboardRepository", () => {
    test("sessiondaki oyuncular icin sifir puanli leaderboard kayitlari olusturur", async () => {
        const fakeCreateManyResult = {
            count: 3
        };

        const prisma = {
            sessionLeaderboard: {
                createMany: jest.fn().mockResolvedValue(fakeCreateManyResult)
            }
        };

        const repository = createSessionLeaderboardRepository(prisma);

        const result = await repository.createMany({
            sessionId: 1,
            playerIds: [10, 11, 12]
        });

        expect(prisma.sessionLeaderboard.createMany).toHaveBeenCalledWith({
            data: [
                {
                    sessionId: 1,
                    playerId: 10,
                    totalScore: 0
                },
                {
                    sessionId: 1,
                    playerId: 11,
                    totalScore: 0
                },
                {
                    sessionId: 1,
                    playerId: 12,
                    totalScore: 0
                }
            ]
        });

        expect(result).toEqual(fakeCreateManyResult);
    });

    test("session leaderboardini oyuncu iliskisiyle skor sirasinda getirir", async () => {
        const fakeLeaderboard = [
            {
                sessionId: 1,
                playerId: 10,
                totalScore: 4,
                player: {
                    nickname: "mert"
                }
            },
            {
                sessionId: 1,
                playerId: 11,
                totalScore: 2,
                player: {
                    nickname: "ali"
                }
            }
        ];

        const prisma = {
            sessionLeaderboard: {
                findMany: jest.fn().mockResolvedValue(fakeLeaderboard)
            }
        };

        const repository = createSessionLeaderboardRepository(prisma);

        const result = await repository.findBySessionId(1);

        expect(prisma.sessionLeaderboard.findMany).toHaveBeenCalledWith({
            where: {
                sessionId: 1
            },
            include: {
                player: true
            },
            orderBy: {
                totalScore: "desc"
            }
        });

        expect(result).toEqual(fakeLeaderboard);
    });

    test("session ve player leaderboard eslesmesini composite key ile bulur", async () => {
        const fakeLeaderboardEntry = {
            sessionId: 1,
            playerId: 10,
            totalScore: 4
        };

        const prisma = {
            sessionLeaderboard: {
                findUnique: jest.fn().mockResolvedValue(fakeLeaderboardEntry)
            }
        };

        const repository = createSessionLeaderboardRepository(prisma);

        const result = await repository.findBySessionAndPlayer({
            sessionId: 1,
            playerId: 10
        });

        expect(prisma.sessionLeaderboard.findUnique).toHaveBeenCalledWith({
            where: {
                sessionId_playerId: {
                    sessionId: 1,
                    playerId: 10
                }
            }
        });

        expect(result).toEqual(fakeLeaderboardEntry);
    });

    test("playerin session skorunu gunceller", async () => {
        const fakeUpdatedEntry = {
            sessionId: 1,
            playerId: 10,
            totalScore: 5
        };

        const prisma = {
            sessionLeaderboard: {
                update: jest.fn().mockResolvedValue(fakeUpdatedEntry)
            }
        };

        const repository = createSessionLeaderboardRepository(prisma);

        const result = await repository.updateScore({
            sessionId: 1,
            playerId: 10,
            totalScore: 5
        });

        expect(prisma.sessionLeaderboard.update).toHaveBeenCalledWith({
            where: {
                sessionId_playerId: {
                    sessionId: 1,
                    playerId: 10
                }
            },
            data: {
                totalScore: 5
            }
        });

        expect(result).toEqual(fakeUpdatedEntry);
    });
});

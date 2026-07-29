const {
    createLeaderboardService
} = require("../src/services/leaderboard.service");

describe("LeaderboardService", () => {
    test("match oyuncusuna session leaderboardini sirali ve anonim olmayan sekilde dondurur", async () => {
        const prisma = {
            match: {
                findUnique: jest.fn().mockResolvedValue({
                    sessionId: 20,
                    session: {
                        players: [
                            { playerId: 1 },
                            { playerId: 2 }
                        ]
                    }
                })
            }
        };
        const sessionLeaderboardRepository = {
            findBySessionId: jest.fn().mockResolvedValue([
                {
                    player: { nickname: "Mert" },
                    totalScore: 5
                },
                {
                    player: { nickname: "Ali" },
                    totalScore: 2
                }
            ])
        };
        const service = createLeaderboardService({
            prisma,
            sessionLeaderboardRepository
        });

        const result = await service.getMatchLeaderboard({
            matchId: 10,
            playerId: 1
        });

        expect(result).toEqual([
            { rank: 1, nickname: "Mert", totalScore: 5 },
            { rank: 2, nickname: "Ali", totalScore: 2 }
        ]);
        expect(sessionLeaderboardRepository.findBySessionId)
            .toHaveBeenCalledWith(20);
    });

    test("session oyuncusu olmayan leaderboard okuyamaz", async () => {
        const service = createLeaderboardService({
            prisma: {
                match: {
                    findUnique: jest.fn().mockResolvedValue({
                        sessionId: 20,
                        session: { players: [{ playerId: 1 }] }
                    })
                }
            },
            sessionLeaderboardRepository: {
                findBySessionId: jest.fn()
            }
        });

        await expect(service.getMatchLeaderboard({
            matchId: 10,
            playerId: 99
        })).rejects.toMatchObject({
            code: "PLAYER_NOT_IN_SESSION"
        });
    });
});

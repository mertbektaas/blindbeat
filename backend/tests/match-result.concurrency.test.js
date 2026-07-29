const {
    createMatchResultService
} = require("../src/services/match-result.service");

describe("MatchResult concurrency", () => {
    test("ayni match icin eszamanli finalize tek transaction calistirir", async () => {
        let resolveTransaction;
        const transactionStarted = new Promise((resolve) => {
            resolveTransaction = resolve;
        });

        const prisma = {
            $transaction: jest.fn(async (callback) => {
                await transactionStarted;
                return callback({
                    match: {
                        findUnique: jest.fn().mockResolvedValue({
                            sessionId: 4,
                            session: {
                                players: [{ playerId: 1 }]
                            },
                            songVariants: [{
                                id: 10,
                                patterns: [{ playerId: 2 }]
                            }],
                            votes: [{ playerId: 1, songVariantId: 10 }]
                        })
                    }
                });
            })
        };

        const service = createMatchResultService({
            prisma,
            runtimeRegistry: {
                getRuntime: () => ({ phase: "VOTING" })
            },
            phaseStateMachine: {
                transition: jest.fn()
            },
            createVoteRepository: () => ({
                findVotingContext: jest.fn().mockResolvedValue({
                    sessionId: 4,
                    session: {
                        players: [{ playerId: 1 }]
                    },
                    songVariants: [{
                        id: 10,
                        patterns: [{ playerId: 2 }]
                    }],
                    votes: [{ playerId: 1, songVariantId: 10 }]
                })
            }),
            createSessionLeaderboardRepository: () => ({
                findBySessionAndPlayer: jest.fn().mockResolvedValue({
                    totalScore: 0
                }),
                updateScore: jest.fn().mockResolvedValue({})
            })
        });

        const first = service.finalizeMatch({ matchId: 5 });
        const second = service.finalizeMatch({ matchId: 5 });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        resolveTransaction();

        const [firstResult, secondResult] = await Promise.all([first, second]);

        expect(firstResult).toEqual(secondResult);
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
});

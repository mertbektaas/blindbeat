const {
    createMatchResultService
} = require("../src/services/match-result.service");

describe("MatchResultService", () => {
    test("tum oylar geldikten sonra leaderboardi gunceller ve match resulta gecer", async () => {
        const runtime = {
            phase: "VOTING"
        };
        const leaderboardRows = new Map([
            [1, { totalScore: 4 }],
            [2, { totalScore: 7 }]
        ]);
        const transactionClient = {
            match: {},
            vote: {},
            sessionLeaderboard: {}
        };
        const prisma = {
            $transaction: jest.fn(async (callback) => callback(transactionClient))
        };
        const phaseStateMachine = {
            transition: jest.fn((currentRuntime, phase) => {
                currentRuntime.phase = phase;
            })
        };
        const runtimeRegistry = {
            getRuntime: jest.fn().mockReturnValue(runtime)
        };
        const voteRepository = {
            findVotingContext: jest.fn().mockResolvedValue({
                sessionId: 20,
                session: {
                    players: [
                        { playerId: 1 },
                        { playerId: 2 }
                    ]
                },
                songVariants: [
                    {
                        id: 101,
                        patterns: [
                            { pattern: { playerId: 1 } },
                            { pattern: { playerId: 2 } }
                        ]
                    },
                    {
                        id: 102,
                        patterns: [
                            { pattern: { playerId: 1 } }
                        ]
                    }
                ],
                votes: [
                    { playerId: 1, songVariantId: 101 },
                    { playerId: 2, songVariantId: 101 }
                ]
            })
        };
        const leaderboardRepository = {
            findBySessionAndPlayer: jest.fn(({ playerId }) =>
                Promise.resolve(leaderboardRows.get(playerId))
            ),
            updateScore: jest.fn().mockResolvedValue({})
        };

        const service = createMatchResultService({
            prisma,
            runtimeRegistry,
            phaseStateMachine,
            createVoteRepository: () => voteRepository,
            createSessionLeaderboardRepository: () => leaderboardRepository
        });

        const result = await service.finalizeMatch({ matchId: 10 });

        expect(result.success).toBe(true);
        expect(result.winnerVariantIds).toEqual([101]);
        expect(phaseStateMachine.transition).toHaveBeenCalledWith(
            runtime,
            "MATCH_RESULT"
        );
        expect(runtime.matchResult).toEqual({
            matchId: 10,
            winnerVariantIds: [101],
            voteCounts: {
                101: 2,
                102: 0
            },
            tie: false,
            unanimous: true
        });
        expect(leaderboardRepository.updateScore).toHaveBeenCalled();
    });
});

const {
    createVoteService
} = require("../src/services/vote.service");

describe("VoteService", () => {
    function createContext() {
        return {
            id: 10,
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
                    patterns: [{ pattern: { playerId: 2 } }]
                },
                {
                    id: 102,
                    patterns: [{ pattern: { playerId: 1 } }]
                }
            ]
        };
    }

    function createDependencies({ phase = "VOTING" } = {}) {
        return {
            voteRepository: {
                findVotingContext: jest.fn().mockResolvedValue(createContext()),
                findByMatchAndPlayer: jest.fn().mockResolvedValue(null),
                createVote: jest.fn().mockResolvedValue({
                    id: 500,
                    matchId: 10,
                    songVariantId: 101
                })
            },
            runtimeRegistry: {
                getRuntime: jest.fn().mockReturnValue({ phase })
            }
        };
    }

    test("VOTING fazinda anonim varyanta oy kaydeder", async () => {
        const dependencies = createDependencies();
        const service = createVoteService(dependencies);

        const result = await service.submitVote({
            matchId: 10,
            playerId: 1,
            songVariantId: 101
        });

        expect(result.success).toBe(true);
        expect(result.vote.songVariantId).toBe(101);
        expect(dependencies.voteRepository.createVote).toHaveBeenCalledWith({
            matchId: 10,
            playerId: 1,
            songVariantId: 101
        });
    });

    test("kendi patterninin bulundugu varyanta da oy verebilir", async () => {
        const dependencies = createDependencies();
        const service = createVoteService(dependencies);

        const result = await service.submitVote({
            matchId: 10,
            playerId: 1,
            songVariantId: 102
        });

        expect(result.success).toBe(true);
        expect(dependencies.voteRepository.createVote).toHaveBeenCalledWith({
            matchId: 10,
            playerId: 1,
            songVariantId: 102
        });
    });

    test("oyuncu ayni matchte ikinci kez oy veremez", async () => {
        const dependencies = createDependencies();
        dependencies.voteRepository.findByMatchAndPlayer.mockResolvedValue({
            id: 900
        });
        const service = createVoteService(dependencies);

        await expect(service.submitVote({
            matchId: 10,
            playerId: 1,
            songVariantId: 101
        })).rejects.toMatchObject({
            code: "VOTE_ALREADY_SUBMITTED"
        });
    });

    test("VOTING disinda oy kabul edilmez", async () => {
        const dependencies = createDependencies({ phase: "PLAYBACK" });
        const service = createVoteService(dependencies);

        await expect(service.submitVote({
            matchId: 10,
            playerId: 1,
            songVariantId: 101
        })).rejects.toMatchObject({
            code: "VOTING_NOT_OPEN"
        });
    });

    test("son oy acki oyuncu puan detaylarini disari sizdirmaz", async () => {
        const dependencies = createDependencies();
        dependencies.voteRepository.findByMatchId = jest.fn()
            .mockResolvedValue([
                { songVariantId: 101 },
                { songVariantId: 101 }
            ]);
        dependencies.matchResultService = {
            finalizeMatch: jest.fn().mockResolvedValue({
                winnerVariantIds: [101],
                pointsByPlayer: { 1: 2, 2: 2 }
            })
        };
        const service = createVoteService(dependencies);

        const result = await service.submitVote({
            matchId: 10,
            playerId: 1,
            songVariantId: 101
        });

        expect(result.matchResult).toEqual({
            phase: "MATCH_RESULT",
            winnerVariantIds: [101]
        });
        expect(result.matchResult.pointsByPlayer).toBeUndefined();
    });
});

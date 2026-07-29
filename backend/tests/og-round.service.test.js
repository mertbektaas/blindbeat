const {
    createOgRoundService
} = require("../src/services/og-round.service");

describe("OG Round service", () => {
    test("berabere liderler icin archive adaylarini hazirlar", async () => {
        const patternRepository = {
            findArchivedBySessionAndPlayers: jest.fn().mockResolvedValue([
                { id: 1, playerId: 2, instrumentId: 10 },
                { id: 2, playerId: 2, instrumentId: 11 },
                { id: 3, playerId: 4, instrumentId: 10 },
                { id: 4, playerId: 4, instrumentId: 11 }
            ])
        };
        const sessionLeaderboardRepository = {
            findBySessionId: jest.fn().mockResolvedValue([
                { playerId: 2, totalScore: 4 },
                { playerId: 4, totalScore: 4 },
                { playerId: 6, totalScore: 1 }
            ])
        };
        const selector = {
            selectCandidates: jest.fn().mockReturnValue({
                candidates: [
                    { playerId: 2, patterns: [{ id: 1 }, { id: 2 }] },
                    { playerId: 4, patterns: [{ id: 3 }, { id: 4 }] }
                ],
                missingInstrumentsByPlayer: {}
            })
        };

        const service = createOgRoundService({
            patternRepository,
            sessionLeaderboardRepository,
            selector
        });

        const result = await service.prepareRound({
            sessionId: 8,
            playerIds: [2, 4, 6],
            instrumentIds: [10, 11],
            excludedPatternIds: [99]
        });

        expect(patternRepository.findArchivedBySessionAndPlayers)
            .toHaveBeenCalledWith({
                sessionId: 8,
                playerIds: [2, 4],
                instrumentIds: [10, 11],
                excludedPatternIds: [99]
            });
        expect(selector.selectCandidates).toHaveBeenCalledWith({
            archivedPatterns: expect.any(Array),
            tiedPlayerIds: [2, 4],
            instrumentIds: [10, 11],
            excludedPatternIds: [99]
        });
        expect(result).toEqual({
            started: true,
            tiedPlayerIds: [2, 4],
            candidates: [
                { playerId: 2, patterns: [{ id: 1 }, { id: 2 }] },
                { playerId: 4, patterns: [{ id: 3 }, { id: 4 }] }
            ],
            missingInstrumentsByPlayer: {},
            patternIds: [1, 2, 3, 4]
        });
    });

    test("archive yeterli degilse turu baslatmadan nedeni dondurur", async () => {
        const service = createOgRoundService({
            patternRepository: {
                findArchivedBySessionAndPlayers: jest.fn().mockResolvedValue([])
            },
            sessionLeaderboardRepository: {
                findBySessionId: jest.fn().mockResolvedValue([
                    { playerId: 2, totalScore: 4 },
                    { playerId: 4, totalScore: 4 }
                ])
            },
            selector: {
                selectCandidates: jest.fn().mockReturnValue({
                    candidates: [],
                    missingInstrumentsByPlayer: {
                        2: [10],
                        4: [10]
                    }
                })
            }
        });

        const result = await service.prepareRound({
            sessionId: 8,
            instrumentIds: [10]
        });

        expect(result.started).toBe(false);
        expect(result.reason).toBe("ARCHIVE_PATTERN_INSUFFICIENT");
    });
});

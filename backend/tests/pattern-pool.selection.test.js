const {
    createPatternPoolSelector,
    selectWeightedPattern
} = require("../src/game/pattern-pool.selection");

describe("PatternPoolSelector", () => {
    test("fairness icin her oyuncudan bir pattern secer", () => {
        const selector = createPatternPoolSelector();
        const result = selector.selectPatternsForVariants({
            patternsByInstrument: {
                2: [
                    { id: 1, playerId: 10, instrumentId: 2 },
                    { id: 2, playerId: 11, instrumentId: 2 }
                ],
                5: [
                    { id: 3, playerId: 12, instrumentId: 5 },
                    { id: 4, playerId: 13, instrumentId: 5 }
                ]
            },
            instrumentIds: [2, 5],
            playerIds: [10, 11, 12, 13],
            variantCount: 2
        });

        expect(result.success).toBe(true);
        expect(result.selectedPatterns).toHaveLength(4);
        expect(result.representedPlayers).toEqual([10, 11, 12, 13]);
        expect(result.selectedCountByInstrument).toEqual({
            2: 2,
            5: 2
        });
    });

    test("slot kapasitesi oyuncu sayisina yetmezse hata doner", () => {
        const selector = createPatternPoolSelector();

        const result = selector.selectPatternsForVariants({
            patternsByInstrument: { 2: [], 5: [] },
            instrumentIds: [2, 5],
            playerIds: [10, 11, 12, 13, 14],
            variantCount: 2
        });

        expect(result).toEqual({
            success: false,
            error: {
                code: "NOT_ENOUGH_PATTERN_SLOTS",
                message: "Fairness icin yeterli song slotu yok."
            }
        });
    });

    test("instrument havuzu variant sayisindan kucukse hata doner", () => {
        const selector = createPatternPoolSelector();

        const result = selector.selectPatternsForVariants({
            patternsByInstrument: {
                2: [{ id: 1, playerId: 10, instrumentId: 2 }],
                5: [
                    { id: 2, playerId: 10, instrumentId: 5 },
                    { id: 3, playerId: 11, instrumentId: 5 }
                ]
            },
            instrumentIds: [2, 5],
            playerIds: [10, 11],
            variantCount: 2
        });

        expect(result.error.code).toBe("INSUFFICIENT_PATTERN_POOL");
    });

    test("oyuncunun patterni yoksa fairness hatasi doner", () => {
        const selector = createPatternPoolSelector();

        const result = selector.selectPatternsForVariants({
            patternsByInstrument: {
                2: [
                    { id: 1, playerId: 10, instrumentId: 2 },
                    { id: 2, playerId: 11, instrumentId: 2 }
                ],
                5: [
                    { id: 3, playerId: 10, instrumentId: 5 },
                    { id: 4, playerId: 11, instrumentId: 5 }
                ]
            },
            instrumentIds: [2, 5],
            playerIds: [10, 11, 12],
            variantCount: 2
        });

        expect(result.error.code).toBe("FAIRNESS_NOT_POSSIBLE");
    });

    test("fairness sonrasi eksik slotlari tamamlar", () => {
        const selector = createPatternPoolSelector();

        const result = selector.selectPatternsForVariants({
            patternsByInstrument: {
                2: [
                    { id: 1, playerId: 10, instrumentId: 2 },
                    { id: 2, playerId: 11, instrumentId: 2 },
                    { id: 3, playerId: 12, instrumentId: 2 }
                ]
            },
            instrumentIds: [2],
            playerIds: [10, 11],
            variantCount: 3,
            currentMatchId: 4,
            randomFn: () => 0
        });

        expect(result.success).toBe(true);
        expect(result.selectedPatterns).toHaveLength(3);
        expect(result.selectedCountByInstrument).toEqual({ 2: 3 });
        expect(new Set(result.selectedPatterns.map(({ id }) => id)).size)
            .toBe(3);
    });

    test("yeni pattern daha yuksek secim agirligi alir", () => {
        const oldPattern = {
            id: 1,
            matchId: 3
        };
        const newPattern = {
            id: 2,
            matchId: 4
        };

        const selected = selectWeightedPattern({
            candidates: [oldPattern, newPattern],
            currentMatchId: 4,
            randomFn: () => 0.49
        });

        expect(selected).toBe(newPattern);
    });
});

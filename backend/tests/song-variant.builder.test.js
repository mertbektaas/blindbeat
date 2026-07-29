const {
    createSongVariantBuilder
} = require("../src/game/song-variant.builder");

describe("SongVariantBuilder", () => {
    test("secili patternleri uc varyanta instrument katmanlariyla dagitir", () => {
        const builder = createSongVariantBuilder();

        const result = builder.buildSongVariants({
            selectedPatterns: [
                { id: 1, playerId: 10, instrumentId: 2 },
                { id: 2, playerId: 11, instrumentId: 2 },
                { id: 3, playerId: 12, instrumentId: 2 },
                { id: 4, playerId: 10, instrumentId: 5 },
                { id: 5, playerId: 11, instrumentId: 5 },
                { id: 6, playerId: 12, instrumentId: 5 }
            ],
            instrumentIds: [2, 5],
            variantCount: 3,
            randomFn: () => 0
        });

        expect(result.success).toBe(true);
        expect(result.variants).toHaveLength(3);

        for (const variant of result.variants) {
            expect(variant.patterns).toHaveLength(2);
            expect(variant.patterns.map(({ instrumentId }) => instrumentId))
                .toEqual([2, 5]);
        }
    });

    test("bir instrument icin eksik pattern varsa hata doner", () => {
        const builder = createSongVariantBuilder();

        const result = builder.buildSongVariants({
            selectedPatterns: [
                { id: 1, playerId: 10, instrumentId: 2 },
                { id: 2, playerId: 11, instrumentId: 2 },
                { id: 3, playerId: 10, instrumentId: 5 }
            ],
            instrumentIds: [2, 5],
            variantCount: 2
        });

        expect(result).toEqual({
            success: false,
            error: {
                code: "INVALID_SELECTED_PATTERN_COUNT",
                message: "Her instrument icin variant sayisi kadar pattern gerekir."
            }
        });
    });

    test("OG varyantinda her yarismacinin kendi patternlerini birlikte tutar", () => {
        const builder = createSongVariantBuilder();

        const result = builder.buildOgSongVariants({
            candidates: [
                {
                    playerId: 10,
                    patterns: [
                        { id: 1, instrumentId: 2 },
                        { id: 4, instrumentId: 5 }
                    ]
                },
                {
                    playerId: 11,
                    patterns: [
                        { id: 2, instrumentId: 2 },
                        { id: 5, instrumentId: 5 }
                    ]
                }
            ],
            instrumentIds: [2, 5]
        });

        expect(result).toEqual({
            success: true,
            variants: [
                {
                    variantNo: 1,
                    playerId: 10,
                    patterns: [
                        {
                            patternId: 1,
                            instrumentId: 2,
                            playerId: 10,
                            slotOrder: 1
                        },
                        {
                            patternId: 4,
                            instrumentId: 5,
                            playerId: 10,
                            slotOrder: 2
                        }
                    ]
                },
                {
                    variantNo: 2,
                    playerId: 11,
                    patterns: [
                        {
                            patternId: 2,
                            instrumentId: 2,
                            playerId: 11,
                            slotOrder: 1
                        },
                        {
                            patternId: 5,
                            instrumentId: 5,
                            playerId: 11,
                            slotOrder: 2
                        }
                    ]
                }
            ]
        });
    });
});

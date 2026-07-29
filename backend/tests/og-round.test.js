const {
    getTiedLeaderIds,
    createOgRoundSelector
} = require("../src/game/og-round");

describe("OG Round", () => {
    test("en yuksek skordaki beraber oyunculari bulur", () => {
        const leaderboard = [
            { playerId: 2, totalScore: 5 },
            { playerId: 4, totalScore: 5 },
            { playerId: 1, totalScore: 3 }
        ];

        expect(getTiedLeaderIds(leaderboard)).toEqual([2, 4]);
    });

    test("beraberlik yoksa OG yarismacisi dondurmez", () => {
        const leaderboard = [
            { playerId: 2, totalScore: 6 },
            { playerId: 4, totalScore: 5 }
        ];

        expect(getTiedLeaderIds(leaderboard)).toEqual([2]);
    });

    test("her yarismaci icin her enstrumandan archive pattern secer", () => {
        const selector = createOgRoundSelector({
            randomFn: () => 0
        });

        const result = selector.selectCandidates({
            tiedPlayerIds: [2, 4],
            instrumentIds: [10, 11],
            archivedPatterns: [
                { id: 101, playerId: 2, instrumentId: 10 },
                { id: 102, playerId: 2, instrumentId: 11 },
                { id: 103, playerId: 4, instrumentId: 10 },
                { id: 104, playerId: 4, instrumentId: 11 }
            ]
        });

        expect(result.candidates).toHaveLength(2);
        expect(result.candidates[0]).toEqual({
            playerId: 2,
            patterns: [
                { id: 101, playerId: 2, instrumentId: 10 },
                { id: 102, playerId: 2, instrumentId: 11 }
            ]
        });
    });

    test("archive patterni eksik oyuncuyu aday yapmaz ve eksigi raporlar", () => {
        const selector = createOgRoundSelector({
            randomFn: () => 0
        });

        const result = selector.selectCandidates({
            tiedPlayerIds: [2, 4],
            instrumentIds: [10, 11],
            archivedPatterns: [
                { id: 101, playerId: 2, instrumentId: 10 },
                { id: 102, playerId: 2, instrumentId: 11 },
                { id: 103, playerId: 4, instrumentId: 10 }
            ]
        });

        expect(result.candidates.map(({ playerId }) => playerId)).toEqual([2]);
        expect(result.missingInstrumentsByPlayer[4]).toEqual([11]);
    });

    test("onceki OG turunda kullanilan patternleri tekrar secmez", () => {
        const selector = createOgRoundSelector({
            randomFn: () => 0
        });

        const result = selector.selectCandidates({
            tiedPlayerIds: [2],
            instrumentIds: [10],
            excludedPatternIds: [101],
            archivedPatterns: [
                { id: 101, playerId: 2, instrumentId: 10 },
                { id: 102, playerId: 2, instrumentId: 10 }
            ]
        });

        expect(result.candidates[0].patterns[0].id).toBe(102);
    });
});

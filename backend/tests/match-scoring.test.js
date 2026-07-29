const {
    calculateMatchScores
} = require("../src/game/match-scoring");

describe("MatchScoring", () => {
    const variants = [
        {
            id: 101,
            patterns: [
                { playerId: 1 },
                { playerId: 2 }
            ]
        },
        {
            id: 102,
            patterns: [
                { playerId: 2 },
                { playerId: 3 }
            ]
        },
        {
            id: 103,
            patterns: [
                { playerId: 1 },
                { playerId: 3 }
            ]
        }
    ];

    test("tek kazanan sarkidaki benzersiz pattern sahiplerine bir puan verir", () => {
        const result = calculateMatchScores({
            variants,
            votes: [
                { songVariantId: 101 },
                { songVariantId: 101 },
                { songVariantId: 102 }
            ]
        });

        expect(result.winnerVariantIds).toEqual([101]);
        expect(result.pointsByPlayer).toEqual({
            1: 1,
            2: 1
        });
        expect(result.unanimous).toBe(false);
    });

    test("tum oylar tek sarkiya gidince x2 uygular", () => {
        const result = calculateMatchScores({
            variants,
            votes: [
                { songVariantId: 101 },
                { songVariantId: 101 },
                { songVariantId: 101 }
            ],
            unanimousVoteMultiplier: 2
        });

        expect(result.unanimous).toBe(true);
        expect(result.pointsByPlayer).toEqual({
            1: 2,
            2: 2
        });
    });

    test("beraberlikte kazanan varyantlardaki pattern sayisi kadar puan verir", () => {
        const result = calculateMatchScores({
            variants,
            votes: [
                { songVariantId: 101 },
                { songVariantId: 102 },
                { songVariantId: 103 }
            ]
        });

        expect(result.tie).toBe(true);
        expect(result.winnerVariantIds).toEqual([101, 102, 103]);
        expect(result.pointsByPlayer).toEqual({
            1: 2,
            2: 2,
            3: 2
        });
    });

    test("oy yoksa kazanan ve puan uretilmez", () => {
        const result = calculateMatchScores({
            variants,
            votes: []
        });

        expect(result.winnerVariantIds).toEqual([]);
        expect(result.pointsByPlayer).toEqual({});
    });
});

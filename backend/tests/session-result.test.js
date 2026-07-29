const {
    createSessionResult
} = require("../src/game/session-result");

describe("Session result", () => {
    test("beraberlik yoksa gold silver bronze siralar", () => {
        const result = createSessionResult({
            leaderboard: [
                { playerId: 2, totalScore: 8 },
                { playerId: 4, totalScore: 5 },
                { playerId: 6, totalScore: 3 },
                { playerId: 7, totalScore: 1 }
            ]
        });

        expect(result).toEqual({
            phase: "SESSION_RESULT",
            tied: false,
            medals: [
                { playerId: 2, medal: "GOLD", totalScore: 8 },
                { playerId: 4, medal: "SILVER", totalScore: 5 },
                { playerId: 6, medal: "BRONZE", totalScore: 3 }
            ]
        });
    });

    test("final beraberlikte berabere liderlerin hepsi gold alir", () => {
        const result = createSessionResult({
            leaderboard: [
                { playerId: 2, totalScore: 8 },
                { playerId: 4, totalScore: 8 },
                { playerId: 6, totalScore: 3 }
            ]
        });

        expect(result.medals).toEqual([
            { playerId: 2, medal: "GOLD", totalScore: 8 },
            { playerId: 4, medal: "GOLD", totalScore: 8 }
        ]);
        expect(result.tied).toBe(true);
    });
});

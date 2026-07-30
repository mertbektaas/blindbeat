const {
    createMatchResultReadiness
} = require("../src/game/match-result.readiness");

describe("MatchResultReadiness", () => {
    function createRuntime() {
        return {
            phase: "MATCH_RESULT",
            stateVersion: 4,
            players: new Map([[1, {}], [2, {}]])
        };
    }

    test("herkes hazir oldugunda sonraki match icin onay verir", () => {
        const readiness = createMatchResultReadiness();
        const runtime = createRuntime();

        expect(readiness.markPlayerReady({ runtime, playerId: 1 })).toEqual({
            accepted: true,
            allReady: false
        });

        expect(readiness.markPlayerReady({ runtime, playerId: 2 })).toEqual({
            accepted: true,
            allReady: true
        });
    });

    test("ayni oyuncunun ikinci onayini tekrar saymaz", () => {
        const readiness = createMatchResultReadiness();
        const runtime = createRuntime();

        readiness.markPlayerReady({ runtime, playerId: 1 });

        expect(readiness.markPlayerReady({ runtime, playerId: 1 })).toEqual({
            accepted: false,
            allReady: false
        });
    });
});

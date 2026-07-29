const {
    createSessionGameFlow
} = require("../src/game/session.game-flow");

describe("SessionGameFlow", () => {
    function createRuntime() {
        return {
            phase: "MATCH_STARTING",
            players: new Map([
                [10, { playerId: 10 }],
                [11, { playerId: 11 }]
            ])
        };
    }

    test("tum oyuncular hazir degilse round baslatmaz", () => {
        const runtime = createRuntime();
        const sessionReadiness = {
            markPlayerReady: jest.fn(),
            areAllPlayersReady: jest.fn().mockReturnValue(false)
        };
        const instrumentRoundManager = {
            startRound: jest.fn()
        };
        const flow = createSessionGameFlow({
            sessionReadiness,
            instrumentRoundManager
        });

        const result = flow.handlePlayerReady({
            runtime,
            playerId: 10,
            instrumentRoundSeconds: 30
        });

        expect(sessionReadiness.markPlayerReady).toHaveBeenCalledWith(
            runtime,
            10
        );
        expect(sessionReadiness.areAllPlayersReady).toHaveBeenCalledWith(runtime);
        expect(instrumentRoundManager.startRound).not.toHaveBeenCalled();
        expect(result).toEqual({
            runtime,
            started: false
        });
    });

    test("tum oyuncular hazirsa instrument round baslatir", () => {
        const runtime = createRuntime();
        const startedRuntime = {
            ...runtime,
            phase: "INSTRUMENT_ROUND"
        };
        const now = new Date("2026-01-01T12:00:00.000Z");
        const sessionReadiness = {
            markPlayerReady: jest.fn(),
            areAllPlayersReady: jest.fn().mockReturnValue(true)
        };
        const instrumentRoundManager = {
            startRound: jest.fn().mockReturnValue(startedRuntime)
        };
        const flow = createSessionGameFlow({
            sessionReadiness,
            instrumentRoundManager
        });

        const result = flow.handlePlayerReady({
            runtime,
            playerId: 10,
            instrumentRoundSeconds: 30,
            now
        });

        expect(instrumentRoundManager.startRound).toHaveBeenCalledWith({
            runtime,
            instrumentRoundSeconds: 30,
            now
        });
        expect(result).toEqual({
            runtime: startedRuntime,
            started: true
        });
    });

    test("runtime disindaki oyuncu icin flow baslamaz", () => {
        const runtime = createRuntime();
        const sessionReadiness = {
            markPlayerReady: jest.fn(),
            areAllPlayersReady: jest.fn()
        };
        const instrumentRoundManager = {
            startRound: jest.fn()
        };
        const flow = createSessionGameFlow({
            sessionReadiness,
            instrumentRoundManager
        });

        expect(() => {
            flow.handlePlayerReady({
                runtime,
                playerId: 99,
                instrumentRoundSeconds: 30
            });
        }).toThrow("oyuncu bulunamadi");

        expect(sessionReadiness.markPlayerReady).not.toHaveBeenCalled();
        expect(instrumentRoundManager.startRound).not.toHaveBeenCalled();
    });
});

const {
    createSessionReadiness
} = require("../src/game/session-readiness");

describe("SessionReadiness", () => {
    function createRuntime() {
        return {
            phase: "MATCH_STARTING",
            stateVersion: 0,
            players: new Map([
                [10, {
                    playerId: 10,
                    ready: false,
                    connected: true
                }],
                [11, {
                    playerId: 11,
                    ready: false,
                    connected: true
                }]
            ])
        };
    }

    test("oyuncuyu hazir olarak isaretler", () => {
        const readiness = createSessionReadiness();
        const runtime = createRuntime();

        const updatedRuntime = readiness.markPlayerReady(runtime, 10);

        expect(updatedRuntime).toBe(runtime);
        expect(runtime.players.get(10).ready).toBe(true);
        expect(runtime.players.get(11).ready).toBe(false);
        expect(runtime.stateVersion).toBe(1);
    });

    test("tum oyuncular hazir degilse false doner", () => {
        const readiness = createSessionReadiness();
        const runtime = createRuntime();

        readiness.markPlayerReady(runtime, 10);

        expect(readiness.areAllPlayersReady(runtime)).toBe(false);
    });

    test("tum oyuncular hazirsa true doner", () => {
        const readiness = createSessionReadiness();
        const runtime = createRuntime();

        readiness.markPlayerReady(runtime, 10);
        readiness.markPlayerReady(runtime, 11);

        expect(readiness.areAllPlayersReady(runtime)).toBe(true);
    });

    test("bos oyuncu listesini hazir kabul etmez", () => {
        const readiness = createSessionReadiness();
        const runtime = createRuntime();
        runtime.players.clear();

        expect(readiness.areAllPlayersReady(runtime)).toBe(false);
    });

    test("runtime disindaki oyuncu hazir yapilamaz", () => {
        const readiness = createSessionReadiness();
        const runtime = createRuntime();

        expect(() => {
            readiness.markPlayerReady(runtime, 99);
        }).toThrow("oyuncu bulanamadi!");
    });

    test("MATCH_STARTING disinda oyuncu hazir yapilamaz", () => {
        const readiness = createSessionReadiness();
        const runtime = createRuntime();
        runtime.phase = "INSTRUMENT_ROUND";

        expect(() => {
            readiness.markPlayerReady(runtime, 10);
        }).toThrow("mac henuz baslamiyor.");
    });
});

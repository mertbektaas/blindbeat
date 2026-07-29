const {
    createReconnectManager
} = require("../src/game/reconnect.manager");

describe("ReconnectManager", () => {
    function createRuntime() {
        return {
            phase: "INSTRUMENT_ROUND",
            deadlineAt: new Date("2026-07-27T12:00:05.000Z"),
            stateVersion: 3,
            players: new Map([
                [7, {
                    playerId: 7,
                    connected: true,
                    reconnectCount: 0,
                    reconnectDeadlineAt: null,
                    roundSkipped: false
                }]
            ])
        };
    }

    test("kopan oyuncuya round suresi kadar reconnect zamani verir", () => {
        const runtime = createRuntime();
        const manager = createReconnectManager({
            instrumentRoundSeconds: 30,
            now: () => new Date("2026-07-27T12:00:10.000Z")
        });

        const result = manager.markDisconnected({
            runtime,
            playerId: 7
        });

        expect(result.reconnectAllowed).toBe(true);
        expect(runtime.players.get(7).connected).toBe(false);
        expect(runtime.deadlineAt.toISOString()).toBe(
            "2026-07-27T12:00:40.000Z"
        );
    });

    test("ilk iki reconnect kabul edilir, ucuncu kopusta tur pas gecilir", () => {
        const runtime = createRuntime();
        const manager = createReconnectManager({
            instrumentRoundSeconds: 30,
            now: () => new Date("2026-07-27T12:00:10.000Z")
        });

        manager.markDisconnected({ runtime, playerId: 7 });
        expect(manager.markReconnected({ runtime, playerId: 7 }).reconnected)
            .toBe(true);

        manager.markDisconnected({ runtime, playerId: 7 });
        expect(manager.markReconnected({ runtime, playerId: 7 }).reconnected)
            .toBe(true);

        const result = manager.markDisconnected({ runtime, playerId: 7 });

        expect(result.reconnectAllowed).toBe(false);
        expect(result.roundSkipped).toBe(true);
        expect(manager.markReconnected({ runtime, playerId: 7 })).toEqual({
            reconnected: false,
            reconnectAllowed: false,
            roundSkipped: true,
            reason: "RECONNECT_LIMIT_REACHED"
        });
    });

    test("round disindaki kopus merkezi deadlinei degistirmez", () => {
        const runtime = createRuntime();
        runtime.phase = "PLAYBACK";
        const originalDeadline = runtime.deadlineAt;
        const manager = createReconnectManager({
            instrumentRoundSeconds: 30,
            now: () => new Date("2026-07-27T12:00:10.000Z")
        });

        manager.markDisconnected({ runtime, playerId: 7 });

        expect(runtime.deadlineAt).toBe(originalDeadline);
    });
});

const {
    createGameRuntimeRegistry
} = require("../src/game/runtime.registry");

describe("GameRuntimeRegistry", () => {
    function createTestRuntime(registry) {
        return registry.getOrCreateRuntime({
            sessionId: 1,
            playerIds: [10, 11],
            sessionInstrumentIds: [3, 4]
        });
    }

    test("yeni session icin runtime olusturur", () => {
        const registry = createGameRuntimeRegistry();

        const runtime = createTestRuntime(registry);

        expect(runtime.sessionId).toBe(1);
        expect(runtime.phase).toBe("MATCH_STARTING");
        expect(runtime.matchNumber).toBe(1);
        expect(runtime.stateVersion).toBe(0);
    });

    test("ayni session icin ayni runtime nesnesini dondurur", () => {
        const registry = createGameRuntimeRegistry();

        const firstRuntime = createTestRuntime(registry);
        const secondRuntime = registry.getOrCreateRuntime({
            sessionId: 1,
            playerIds: [99],
            sessionInstrumentIds: [8]
        });

        expect(secondRuntime).toBe(firstRuntime);
    });

    test("oyuncular runtime icindeki players Map ine eklenir", () => {
        const registry = createGameRuntimeRegistry();

        const runtime = createTestRuntime(registry);

        expect(runtime.players.size).toBe(2);
        expect(runtime.players.get(10)).toEqual({
            playerId: 10,
            draftPattern: null,
            locked: false,
            connected: true,
            ready: false,
            reconnectCount: 0,
            reconnectDeadlineAt: null,
            roundSkipped: false
        });
    });

    test("olmayan runtime icin undefined dondurur", () => {
        const registry = createGameRuntimeRegistry();

        expect(registry.getRuntime(99)).toBeUndefined();
    });

    test("runtime silindikten sonra tekrar bulunamaz", () => {
        const registry = createGameRuntimeRegistry();

        createTestRuntime(registry);

        expect(registry.deleteRuntime(1)).toBe(true);
        expect(registry.getRuntime(1)).toBeUndefined();
    });
});

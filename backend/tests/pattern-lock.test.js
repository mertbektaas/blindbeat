const {
    createPatternLockManager
} = require("../src/game/pattern-lock");

describe("PatternLockManager", () => {
    const patternData = {
        version: 1,
        instrumentType: "bass",
        stepCount: 1,
        data: {
            steps: [null]
        }
    };

    function createRuntime() {
        return {
            phase: "INSTRUMENT_ROUND",
            currentInstrumentId: 7,
            stateVersion: 0,
            players: new Map([
                [10, {
                    playerId: 10,
                    draftPattern: patternData,
                    locked: false,
                    connected: true
                }],
                [11, {
                    playerId: 11,
                    draftPattern: patternData,
                    locked: true,
                    connected: true
                }]
            ])
        };
    }

    function createService(result = {
        success: true,
        pattern: { id: 100, patternData }
    }) {
        return {
            submitPattern: jest.fn().mockResolvedValue(result)
        };
    }

    test("basarili pattern kaydindan sonra oyuncuyu locklar", async () => {
        const runtime = createRuntime();
        const patternService = createService();
        const manager = createPatternLockManager({ patternService });

        const result = await manager.lockPattern({
            runtime,
            playerId: 10,
            matchId: 50
        });

        expect(patternService.submitPattern).toHaveBeenCalledWith({
            playerId: 10,
            matchId: 50,
            instrumentId: 7,
            patternData
        });
        expect(runtime.players.get(10).locked).toBe(true);
        expect(runtime.stateVersion).toBe(1);
        expect(result.success).toBe(true);
    });

    test("service basarisizsa oyuncu locklanmaz", async () => {
        const runtime = createRuntime();
        const patternService = createService({
            success: false,
            error: { code: "INVALID_PATTERN" }
        });
        const manager = createPatternLockManager({ patternService });

        const result = await manager.lockPattern({
            runtime,
            playerId: 10,
            matchId: 50
        });

        expect(result.success).toBe(false);
        expect(runtime.players.get(10).locked).toBe(false);
        expect(runtime.stateVersion).toBe(0);
    });

    test("ikinci lock istegi reddedilir", async () => {
        const runtime = createRuntime();
        const patternService = createService();
        const manager = createPatternLockManager({ patternService });

        await expect(manager.lockPattern({
            runtime,
            playerId: 11,
            matchId: 50
        })).rejects.toThrow("zaten locklamis");

        expect(patternService.submitPattern).not.toHaveBeenCalled();
    });

    test("drafti olmayan oyuncu locklanamaz", async () => {
        const runtime = createRuntime();
        runtime.players.get(10).draftPattern = null;
        const patternService = createService();
        const manager = createPatternLockManager({ patternService });

        await expect(manager.lockPattern({
            runtime,
            playerId: 10,
            matchId: 50
        })).rejects.toThrow("draftPattern'i yok");

        expect(patternService.submitPattern).not.toHaveBeenCalled();
    });

    test("yanlis phasete lock yapilamaz", async () => {
        const runtime = createRuntime();
        runtime.phase = "MATCH_STARTING";
        const patternService = createService();
        const manager = createPatternLockManager({ patternService });

        await expect(manager.lockPattern({
            runtime,
            playerId: 10,
            matchId: 50
        })).rejects.toThrow("phase INSTRUMENT_ROUND degil");

        expect(patternService.submitPattern).not.toHaveBeenCalled();
    });

    test("pattern service hata firlatirsa oyuncu locklanmaz", async () => {
        const runtime = createRuntime();
        const patternService = {
            submitPattern: jest.fn().mockRejectedValue(new Error("database down"))
        };
        const manager = createPatternLockManager({ patternService });

        await expect(manager.lockPattern({
            runtime,
            playerId: 10,
            matchId: 50
        })).rejects.toThrow("database down");

        expect(runtime.players.get(10).locked).toBe(false);
        expect(runtime.stateVersion).toBe(0);
    });
});

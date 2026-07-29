const {
    createPlaybackReadiness
} = require("../src/game/playback-readiness");

describe("PlaybackReadiness", () => {
    function createRuntime() {
        return {
            phase: "PLAYBACK",
            stateVersion: 0,
            players: new Map([
                [1, {}],
                [2, {}]
            ]),
            playbackReadyPlayerIds: new Set()
        };
    }

    test("tum oyuncular hazir olmadan allReady false doner", () => {
        const readiness = createPlaybackReadiness();
        const result = readiness.markClientReady({
            runtime: createRuntime(),
            playerId: 1
        });

        expect(result.accepted).toBe(true);
        expect(result.allReady).toBe(false);
    });

    test("tum oyuncular hazir oldugunda allReady true doner", () => {
        const readiness = createPlaybackReadiness();
        const runtime = createRuntime();

        readiness.markClientReady({ runtime, playerId: 1 });
        const result = readiness.markClientReady({ runtime, playerId: 2 });

        expect(result.allReady).toBe(true);
        expect(runtime.playbackReadyPlayerIds).toEqual(new Set([1, 2]));
    });

    test("ayni oyuncunun tekrar hazir mesaji duplicate sayilir", () => {
        const readiness = createPlaybackReadiness();
        const runtime = createRuntime();

        readiness.markClientReady({ runtime, playerId: 1 });
        const stateVersionAfterFirstMessage = runtime.stateVersion;
        const result = readiness.markClientReady({ runtime, playerId: 1 });

        expect(result.accepted).toBe(false);
        expect(result.alreadyReady).toBe(true);
        expect(runtime.stateVersion).toBe(stateVersionAfterFirstMessage);
    });

    test("PLAYBACK disindaki fazlarda hazir mesaji reddedilir", () => {
        const readiness = createPlaybackReadiness();
        const runtime = createRuntime();
        runtime.phase = "INSTRUMENT_ROUND";

        expect(() => {
            readiness.markClientReady({ runtime, playerId: 1 });
        }).toThrow("phase PLAYBACK");
    });
});

const {
    createPlaybackPhaseManager
} = require("../src/game/playback-phase");

describe("PlaybackPhaseManager", () => {
    test("match building tamamlanınca playback fazına geçer", () => {
        const runtime = {
            phase: "MATCH_BUILDING",
            variantOrder: [],
            playbackStartAt: "old-value",
            stateVersion: 0
        };

        const phaseStateMachine = {
            transition: jest.fn((currentRuntime, nextPhase) => {
                currentRuntime.phase = nextPhase;
                currentRuntime.stateVersion += 1;
                return currentRuntime;
            })
        };

        const playbackReadiness = {
            reset: jest.fn()
        };

        const playbackCompletion = {
            reset: jest.fn()
        };

        const manager = createPlaybackPhaseManager({
            phaseStateMachine,
            playbackReadiness,
            playbackCompletion,
            randomFn: () => 0
        });

        const result = manager.enterPlayback({
            runtime,
            variants: [
                { variantNo: 1 },
                { variantNo: 2 },
                { variantNo: 3 }
            ]
        });

        expect(result.phase).toBe("PLAYBACK");
        expect(result.variantOrder).toEqual([2, 3, 1]);
        expect(result.playbackStartAt).toBeNull();
        expect(phaseStateMachine.transition).toHaveBeenCalledWith(
            runtime,
            "PLAYBACK"
        );
        expect(playbackReadiness.reset).toHaveBeenCalledWith(runtime);
        expect(playbackCompletion.reset).toHaveBeenCalledWith(runtime);
    });

    test("match building disinda playback baslatilamaz", () => {
        const manager = createPlaybackPhaseManager({
            phaseStateMachine: { transition: jest.fn() },
            playbackReadiness: { reset: jest.fn() },
            playbackCompletion: { reset: jest.fn() }
        });

        expect(() => manager.enterPlayback({
            runtime: { phase: "INSTRUMENT_ROUND" },
            variants: []
        })).toThrow("Playback fazına geçilemez");
    });

    test("OG rounddan playback baslatir", () => {
        const runtime = {
            phase: "OG_ROUND",
            variantOrder: [],
            playbackStartAt: null,
            stateVersion: 0
        };
        const manager = createPlaybackPhaseManager({
            phaseStateMachine: {
                transition: jest.fn((currentRuntime, nextPhase) => {
                    currentRuntime.phase = nextPhase;
                })
            },
            playbackReadiness: {
                reset: jest.fn()
            },
            playbackCompletion: {
                reset: jest.fn()
            },
            randomFn: () => 0
        });

        const result = manager.enterPlayback({
            runtime,
            variants: [{ variantNo: 1 }, { variantNo: 2 }]
        });

        expect(result.phase).toBe("PLAYBACK");
        expect(runtime.variantOrder).toEqual([2, 1]);
    });
});

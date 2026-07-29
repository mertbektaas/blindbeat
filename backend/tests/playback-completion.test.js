const {
    createPlaybackCompletion
} = require("../src/game/playback-completion");

describe("PlaybackCompletion", () => {
    function createRuntime() {
        return {
            phase: "PLAYBACK",
            stateVersion: 0,
            players: new Map([
                [1, {}],
                [2, {}]
            ]),
            playbackCompletedPlayerIds: new Set()
        };
    }

    test("tum oyuncular bitirmeden voting fazina gecmez", () => {
        const phaseStateMachine = {
            transition: jest.fn((runtime, phase) => {
                runtime.phase = phase;
            })
        };
        const completion = createPlaybackCompletion({ phaseStateMachine });
        const runtime = createRuntime();

        const result = completion.markClientCompleted({
            runtime,
            playerId: 1
        });

        expect(result.accepted).toBe(true);
        expect(result.allCompleted).toBe(false);
        expect(runtime.phase).toBe("PLAYBACK");
        expect(phaseStateMachine.transition).not.toHaveBeenCalled();
    });

    test("son oyuncu bitirince voting fazina gecilir", () => {
        const phaseStateMachine = {
            transition: jest.fn((runtime, phase) => {
                runtime.phase = phase;
            })
        };
        const completion = createPlaybackCompletion({ phaseStateMachine });
        const runtime = createRuntime();

        completion.markClientCompleted({ runtime, playerId: 1 });
        const result = completion.markClientCompleted({
            runtime,
            playerId: 2
        });

        expect(result.allCompleted).toBe(true);
        expect(result.phase).toBe("VOTING");
        expect(phaseStateMachine.transition).toHaveBeenCalledWith(
            runtime,
            "VOTING"
        );
    });

    test("ayni oyuncunun ikinci tamamlandi mesaji tekrar sayilmaz", () => {
        const phaseStateMachine = {
            transition: jest.fn()
        };
        const completion = createPlaybackCompletion({ phaseStateMachine });
        const runtime = createRuntime();

        completion.markClientCompleted({ runtime, playerId: 1 });
        const stateVersion = runtime.stateVersion;
        const result = completion.markClientCompleted({
            runtime,
            playerId: 1
        });

        expect(result.accepted).toBe(false);
        expect(result.alreadyCompleted).toBe(true);
        expect(runtime.stateVersion).toBe(stateVersion);
    });
});

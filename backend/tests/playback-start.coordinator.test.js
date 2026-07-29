const {
    createPlaybackStartCoordinator
} = require("../src/game/playback-start.coordinator");

describe("PlaybackStartCoordinator", () => {
    function createRuntime() {
        return {
            phase: "PLAYBACK",
            currentMatchId: 19,
            stateVersion: 4,
            players: new Map([
                [1, {}],
                [2, {}]
            ]),
            playbackStartAt: null,
            variantOrder: [2, 1, 3]
        };
    }

    function createConnectionRegistry() {
        const sockets = new Map([
            [1, { readyState: 1, send: jest.fn() }],
            [2, { readyState: 0, send: jest.fn() }]
        ]);

        return {
            sockets,
            getSocketByPlayerId: (playerId) => sockets.get(playerId)
        };
    }

    test("gelecekteki start zamanini uretip online clientlara gonderir", () => {
        const connectionRegistry = createConnectionRegistry();
        const coordinator = createPlaybackStartCoordinator({
            connectionRegistry,
            gameConfig: {
                playbackStartDelayMs: 2000,
                defaultBpm: 120,
                playbackLoops: 5
            },
            now: () => 1_000_000
        });
        const runtime = createRuntime();

        const result = coordinator.startPlayback({
            runtime,
            variantOrder: [2, 1, 3]
        });

        expect(result.started).toBe(true);
        expect(result.sentCount).toBe(1);
        expect(result.startAt).toBe("1970-01-01T00:16:42.000Z");
        expect(runtime.playbackStartAt).toBe(result.startAt);
        expect(connectionRegistry.sockets.get(1).send).toHaveBeenCalledWith(
            expect.stringContaining('"type":"playback:start"')
        );
        expect(connectionRegistry.sockets.get(1).send).toHaveBeenCalledWith(
            expect.stringContaining('"matchId":19')
        );
    });

    test("ikinci baslatma istegi yeni start zamani uretmez", () => {
        const coordinator = createPlaybackStartCoordinator({
            connectionRegistry: createConnectionRegistry(),
            gameConfig: {
                playbackStartDelayMs: 2000,
                defaultBpm: 120,
                playbackLoops: 5
            },
            now: () => 1_000_000
        });
        const runtime = createRuntime();

        const first = coordinator.startPlayback({ runtime });
        const second = coordinator.startPlayback({ runtime });

        expect(first.started).toBe(true);
        expect(second.started).toBe(false);
        expect(second.alreadyStarted).toBe(true);
        expect(second.startAt).toBe(first.startAt);
    });

    test("PLAYBACK disindaki fazlarda baslatma reddedilir", () => {
        const coordinator = createPlaybackStartCoordinator({
            connectionRegistry: createConnectionRegistry(),
            gameConfig: {
                playbackStartDelayMs: 2000,
                defaultBpm: 120,
                playbackLoops: 5
            }
        });
        const runtime = createRuntime();
        runtime.phase = "VOTING";

        expect(() => coordinator.startPlayback({ runtime })).toThrow(
            "phase PLAYBACK"
        );
    });
});

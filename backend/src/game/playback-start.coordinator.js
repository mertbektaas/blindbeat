function createPlaybackStartCoordinator({
    connectionRegistry,
    gameConfig,
    now = () => Date.now()
}) {
    function startPlayback({ runtime, variantOrder = [] }) {
        if (runtime.phase !== "PLAYBACK") {
            throw new Error("Playback baslatmak icin phase PLAYBACK olmalidir.");
        }

        if (runtime.playbackStartAt) {
            return {
                started: false,
                alreadyStarted: true,
                startAt: runtime.playbackStartAt,
                sentCount: 0
            };
        }

        const serverNow = now();
        const startAt = new Date(
            serverNow + gameConfig.playbackStartDelayMs
        ).toISOString();

        runtime.playbackStartAt = startAt;
        runtime.stateVersion++;

        const message = JSON.stringify({
            type: "playback:start",
            stateVersion: runtime.stateVersion,
            payload: {
                matchId: runtime.currentMatchId,
                startAt,
                serverTime: new Date(serverNow).toISOString(),
                bpm: gameConfig.defaultBpm,
                stepCount: gameConfig.defaultStepCount,
                playbackLoops: gameConfig.playbackLoops,
                variantOrder
            }
        });

        let sentCount = 0;

        for (const playerId of runtime.players.keys()) {
            const socket = connectionRegistry.getSocketByPlayerId(playerId);

            if (!socket || socket.readyState !== 1) {
                continue;
            }

            socket.send(message);
            sentCount++;
        }

        return {
            started: true,
            alreadyStarted: false,
            startAt,
            sentCount
        };
    }

    return {
        startPlayback
    };
}

module.exports = {
    createPlaybackStartCoordinator
};

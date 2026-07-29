function createPlaybackCompletion({ phaseStateMachine }) {
    function ensureCompletedPlayerIds(runtime) {
        runtime.playbackCompletedPlayerIds ??= new Set();
        return runtime.playbackCompletedPlayerIds;
    }

    function areAllPlayersCompleted(runtime) {
        const completedPlayerIds = ensureCompletedPlayerIds(runtime);

        if (runtime.players.size === 0) {
            return false;
        }

        for (const playerId of runtime.players.keys()) {
            if (!completedPlayerIds.has(playerId)) {
                return false;
            }
        }

        return true;
    }

    function markClientCompleted({ runtime, playerId }) {
        if (runtime.phase !== "PLAYBACK") {
            throw new Error("Playback tamamlanmasi icin phase PLAYBACK olmalidir.");
        }

        if (!runtime.players.has(playerId)) {
            throw new Error("Playback tamamlayan oyuncu bulunamadi.");
        }

        const completedPlayerIds = ensureCompletedPlayerIds(runtime);

        if (completedPlayerIds.has(playerId)) {
            return {
                accepted: false,
                alreadyCompleted: true,
                allCompleted: areAllPlayersCompleted(runtime)
            };
        }

        completedPlayerIds.add(playerId);
        runtime.stateVersion++;

        const allCompleted = areAllPlayersCompleted(runtime);

        if (allCompleted) {
            phaseStateMachine.transition(runtime, "VOTING");
        }

        return {
            accepted: true,
            alreadyCompleted: false,
            allCompleted,
            phase: runtime.phase
        };
    }

    function reset(runtime) {
        runtime.playbackCompletedPlayerIds = new Set();
        runtime.stateVersion++;
        return runtime;
    }

    return {
        markClientCompleted,
        areAllPlayersCompleted,
        reset
    };
}

module.exports = {
    createPlaybackCompletion
};

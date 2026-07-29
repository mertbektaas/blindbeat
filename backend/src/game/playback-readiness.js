function createPlaybackReadiness() {
    function ensureReadyPlayerIds(runtime) {
        runtime.playbackReadyPlayerIds ??= new Set();
        return runtime.playbackReadyPlayerIds;
    }

    function areAllPlayersReady(runtime) {
        const readyPlayerIds = ensureReadyPlayerIds(runtime);

        if (runtime.players.size === 0) {
            return false;
        }

        for (const playerId of runtime.players.keys()) {
            if (!readyPlayerIds.has(playerId)) {
                return false;
            }
        }

        return true;
    }

    function markClientReady({ runtime, playerId }) {
        if (runtime.phase !== "PLAYBACK") {
            throw new Error("Playback hazirligi icin phase PLAYBACK olmalidir.");
        }

        if (!runtime.players.has(playerId)) {
            throw new Error("Playback hazirligi gonderen oyuncu bulunamadi.");
        }

        const readyPlayerIds = ensureReadyPlayerIds(runtime);

        if (readyPlayerIds.has(playerId)) {
            return {
                accepted: false,
                alreadyReady: true,
                allReady: areAllPlayersReady(runtime)
            };
        }

        readyPlayerIds.add(playerId);
        runtime.stateVersion++;

        return {
            accepted: true,
            alreadyReady: false,
            allReady: areAllPlayersReady(runtime)
        };
    }

    function reset(runtime) {
        runtime.playbackReadyPlayerIds = new Set();
        runtime.stateVersion++;
        return runtime;
    }

    return {
        markClientReady,
        areAllPlayersReady,
        reset
    };
}

module.exports = {
    createPlaybackReadiness
};

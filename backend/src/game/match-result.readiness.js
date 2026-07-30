function createMatchResultReadiness() {
    function ensureReadyPlayerIds(runtime) {
        runtime.matchResultReadyPlayerIds ??= new Set();
        return runtime.matchResultReadyPlayerIds;
    }

    function markPlayerReady({ runtime, playerId }) {
        if (runtime.phase !== "MATCH_RESULT") {
            throw new Error("Sonuç ekranı henüz açık değil.");
        }

        if (!runtime.players.has(playerId)) {
            throw new Error("Sonuç için hazır olan oyuncu bulunamadı.");
        }

        const readyPlayerIds = ensureReadyPlayerIds(runtime);

        if (readyPlayerIds.has(playerId)) {
            return {
                accepted: false,
                allReady: areAllPlayersReady(runtime)
            };
        }

        readyPlayerIds.add(playerId);
        runtime.stateVersion++;

        return {
            accepted: true,
            allReady: areAllPlayersReady(runtime)
        };
    }

    function areAllPlayersReady(runtime) {
        const readyPlayerIds = ensureReadyPlayerIds(runtime);

        return runtime.players.size > 0 &&
            [...runtime.players.keys()].every((playerId) => readyPlayerIds.has(playerId));
    }

    function reset(runtime) {
        runtime.matchResultReadyPlayerIds = new Set();
    }

    return {
        markPlayerReady,
        areAllPlayersReady,
        reset
    };
}

module.exports = {
    createMatchResultReadiness
};

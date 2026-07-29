function createGameRuntimeRegistry() {
    const runtimeBySessionId = new Map();

    function getOrCreateRuntime({
        sessionId,
        playerIds,
        sessionInstrumentIds,
        sessionInstrumentCodes = [],
        sessionInstrumentCategories = [],
        bpm = 120,
        playbackLoops = 5,
        matchId,
        stepCount,
        maxMatchCount

    }) {
        if (runtimeBySessionId.has(sessionId)){
            return runtimeBySessionId.get(sessionId);
        }

        const runtime = {
            sessionId: sessionId,
            currentMatchId: matchId,
            matchNumber: 1,
            maxMatchCount: maxMatchCount ?? null,
            phase: "MATCH_STARTING",
            currentInstrumentIndex: 0,
            currentInstrumentId: null,
            roundStartedAt: null,
            deadlineAt: null,
            stateVersion: 0,
            sessionInstrumentIds: sessionInstrumentIds,
            sessionInstrumentCodes: sessionInstrumentCodes,
            sessionInstrumentCategories: sessionInstrumentCategories,
            bpm: bpm,
            playbackLoops: playbackLoops,
            stepCount: stepCount,
            playbackReadyPlayerIds: new Set(),
            playbackCompletedPlayerIds: new Set(),
            playbackStartAt: null,
            variantOrder: [],
            matchResult: null,
            sessionResult: null,
            ogRoundNumber: 0,
            usedOgPatternIds: new Set(),
            players: new Map()
        }

        for (const playerId of playerIds) {
            runtime.players.set(playerId, {
                playerId: playerId,
                draftPattern: null,
                locked: false,
                connected: true,
                ready: false,
                reconnectCount: 0,
                reconnectDeadlineAt: null,
                roundSkipped: false,
            })
        }

        runtimeBySessionId.set(sessionId, runtime);
        
        return runtime;
    }

    function getRuntime(sessionId) {
       return runtimeBySessionId.get(sessionId);
    }

    function deleteRuntime(sessionId) {
        return runtimeBySessionId.delete(sessionId);
    }

    function getAllRuntimes(){
        return Array.from(runtimeBySessionId.values());
    }

    return {
        getOrCreateRuntime,
        getRuntime,
        deleteRuntime,
        getAllRuntimes
    };
}

module.exports = {
    createGameRuntimeRegistry
};

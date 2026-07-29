function createGameStateSnapshot(runtime, viewerPlayerId) {
    const players = [...runtime.players.values()].map((playerState) => {
        return {
            playerId: playerState.playerId,
            locked: playerState.locked,
            connected: playerState.connected,
            ready: playerState.ready
        };
    });

    return {
        sessionId: runtime.sessionId,
        matchNumber: runtime.matchNumber,
        currentMatchId: runtime.currentMatchId,
        phase: runtime.phase,
        currentInstrumentIndex: runtime.currentInstrumentIndex,
        currentInstrumentId: runtime.currentInstrumentId,
        currentInstrumentCode: runtime.currentInstrumentIndex !== null
            ? runtime.sessionInstrumentCodes?.[runtime.currentInstrumentIndex] || null
            : null,
        currentInstrumentCategory: runtime.currentInstrumentIndex !== null
            ? runtime.sessionInstrumentCategories?.[runtime.currentInstrumentIndex] || null
            : null,
        bpm: runtime.bpm,
        playbackLoops: runtime.playbackLoops,
        myLocked: runtime.players.get(viewerPlayerId)?.locked ?? false,
        roundStartedAt: runtime.roundStartedAt
            ? runtime.roundStartedAt.toISOString()
            : null,
        deadlineAt: runtime.deadlineAt
            ? runtime.deadlineAt.toISOString()
            : null,
        variantOrder: runtime.variantOrder || [],
        stateVersion: runtime.stateVersion,
        matchResult: runtime.matchResult
            ? {
                matchId: runtime.matchResult.matchId,
                winnerVariantIds: runtime.matchResult.winnerVariantIds,
                voteCounts: runtime.matchResult.voteCounts,
                tie: runtime.matchResult.tie,
                unanimous: runtime.matchResult.unanimous
            }
            : null,
        sessionResult: runtime.sessionResult ?? null,
        players,
        myDraftPattern: runtime.players.get(viewerPlayerId)?.draftPattern ?? null
    };
}

module.exports = {
    createGameStateSnapshot
};

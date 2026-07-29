function createRoundDeadlineScheduler({
    runtimeRegistry,
    roundFinalizer,
    instrumentRoundManager,
    gameStateBroadcaster,
    gameConfig,
    songAssemblyService,
    playbackPhaseManager
}) {
    let intervalId = null;
    const processingSessionIds = new Set();

    async function checkDeadlines() {
        const runtimes = runtimeRegistry.getAllRuntimes();
        const now = new Date();

        for (const runtime of runtimes){
            if (runtime.phase !== "INSTRUMENT_ROUND") continue;
            if (!runtime.deadlineAt) continue;
            if(runtime.deadlineAt.getTime() > now.getTime()) continue;

            if(processingSessionIds.has(runtime.sessionId)) continue;
            
            processingSessionIds.add(runtime.sessionId);

            try {
                const result = await roundFinalizer.finalizeRound({runtime, matchId: runtime.currentMatchId, now});

                if(result.completed && result.runtime.phase === "NEXT_INSTRUMENT"){
                    instrumentRoundManager.startRound({runtime, instrumentRoundSeconds: gameConfig.instrumentRoundSeconds, now});
                }

                if(result.completed && result.runtime.phase === "MATCH_BUILDING"){
                    const buildResult = await songAssemblyService.buildMatchSongVariants({
                        sessionId: runtime.sessionId,
                        matchId: runtime.currentMatchId,
                        instrumentIds: runtime.sessionInstrumentIds,
                        playerIds: [...runtime.players.keys()],
                        variantCount: gameConfig.songVariantCount,
                        currentMatchId: runtime.currentMatchId
                    });

                    if (buildResult.success) {
                        playbackPhaseManager.enterPlayback({
                            runtime,
                            variants: buildResult.variants
                        });
                    }
                }

                gameStateBroadcaster.broadcastGameState(runtime.sessionId);
            }

            finally {
                processingSessionIds.delete(runtime.sessionId)
            }
        }
    }

    function start() {
        if(!intervalId)
        intervalId = setInterval(checkDeadlines, 1000);
    }

    function stop() {
        clearInterval(intervalId);
        intervalId = null;
    }

    return {
        start,
        stop,
        checkDeadlines,
    };
}

module.exports = {
    createRoundDeadlineScheduler
};

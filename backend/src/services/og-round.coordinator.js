function createOgRoundCoordinator({
    runtimeRegistry,
    phaseStateMachine,
    ogRoundService,
    matchRepository,
    songAssemblyService,
    playbackPhaseManager
}) {
    async function startRound({
        sessionId,
        maxMatchCount,
        instrumentIds,
        playerIds
    }) {
        const runtime = runtimeRegistry.getRuntime(sessionId);

        if (!runtime) {
            return {
                started: false,
                reason: "GAME_RUNTIME_NOT_FOUND"
            };
        }

        const archiveSelection = await ogRoundService.prepareRound({
            sessionId,
            playerIds,
            instrumentIds,
            excludedPatternIds: [...runtime.usedOgPatternIds]
        });

        if (!archiveSelection.started) {
            return archiveSelection;
        }

        const matchNumber = maxMatchCount + runtime.ogRoundNumber + 1;
        const match = await matchRepository.createMatch({
            sessionId,
            matchNumber
        });

        try {
            const build = await songAssemblyService.buildOgRoundSongVariants({
                matchId: match.id,
                candidates: archiveSelection.candidates,
                instrumentIds
            });

            if (!build.success) {
                await matchRepository.deleteMatch(match.id);
                return build;
            }

            runtime.currentMatchId = match.id;
            runtime.matchNumber = matchNumber;
            runtime.ogRoundNumber += 1;
            runtime.matchResult = null;

            for (const patternId of archiveSelection.patternIds) {
                runtime.usedOgPatternIds.add(patternId);
            }

            phaseStateMachine.transition(runtime, "OG_ROUND");
            playbackPhaseManager.enterPlayback({
                runtime,
                variants: build.variants
            });

            return {
                started: true,
                sessionId,
                matchId: match.id,
                matchNumber,
                candidatePlayerIds: archiveSelection.tiedPlayerIds,
                variants: build.variants
            };
        } catch (error) {
            await matchRepository.deleteMatch(match.id);
            throw error;
        }
    }

    return {
        startRound
    };
}

module.exports = {
    createOgRoundCoordinator
};

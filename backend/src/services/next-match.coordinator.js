function createNextMatchCoordinator({
    matchRepository,
    phaseStateMachine
}) {
    async function startNextMatch({ runtime, maxMatchCount }) {
        if (runtime.matchNumber >= maxMatchCount) {
            return {
                started: false,
                reason: "NO_MATCH_LEFT"
            };
        }

        const match = await matchRepository.createMatch({
            sessionId: runtime.sessionId,
            matchNumber: runtime.matchNumber + 1
        });

        runtime.currentMatchId = match.id;
        runtime.matchNumber = match.matchNumber;
        runtime.matchResult = null;
        runtime.playbackStartAt = null;
        runtime.variantOrder = [];
        runtime.currentInstrumentIndex = 0;
        runtime.currentInstrumentId = null;
        runtime.roundStartedAt = null;
        runtime.deadlineAt = null;

        for (const player of runtime.players.values()) {
            player.draftPattern = null;
            player.locked = false;
            player.ready = false;
            player.reconnectCount = 0;
            player.reconnectDeadlineAt = null;
            player.roundSkipped = false;
        }

        phaseStateMachine.transition(runtime, "MATCH_STARTING");

        return {
            started: true,
            match
        };
    }

    return {
        startNextMatch
    };
}

module.exports = {
    createNextMatchCoordinator
};

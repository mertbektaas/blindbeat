const { GAME_PHASES } = require("../game/phase.game-state.machine");

function createNextMatchCoordinator({
    matchRepository,
    phaseStateMachine,
    instrumentRoundManager
}) {
    async function startNextMatch({ runtime, maxMatchCount, instrumentRoundSeconds }) {
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
        runtime.matchResultReadyPlayerIds = new Set();
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

        // Sonraki match'lerde "MATCH_STARTING" hazır ekranını atla,
        // direkt ilk instrument round'a geç. Oyuncular zaten aktif,
        // tekrar ready sormak gereksiz.
        if (runtime.matchNumber > 1) {
            phaseStateMachine.transition(runtime, GAME_PHASES.MATCH_STARTING);
            runtime.currentInstrumentId = runtime.sessionInstrumentIds[0];
            phaseStateMachine.transition(runtime, GAME_PHASES.INSTRUMENT_ROUND);

            const now = new Date();
            runtime.roundStartedAt = now;
            runtime.deadlineAt = new Date(now.getTime() + instrumentRoundSeconds * 1000);
        } else {
            phaseStateMachine.transition(runtime, GAME_PHASES.MATCH_STARTING);
        }

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

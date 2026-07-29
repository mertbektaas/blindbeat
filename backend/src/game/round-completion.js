function createRoundCompletion() {
    function areAllPlayersLocked(runtime) {

        if(runtime.players.size === 0){
            return false;
        }

        for (const [playerId, playerState] of runtime.players){
            if(playerState.locked !== true) return false;
        }

        return true;
    }

    function isDeadlineReached(runtime, now = new Date()) {

        if(!runtime.deadlineAt) return false;

        if(now.getTime() >= runtime.deadlineAt.getTime()) return true;

        return false;
    }

    function shouldEndRound(runtime, now = new Date()) {

        if(runtime.phase !== "INSTRUMENT_ROUND") return false;

        if (areAllPlayersLocked(runtime)) return true;

        if(isDeadlineReached(runtime, now)) return true;

        return false;
    }

    return {
        areAllPlayersLocked,
        isDeadlineReached,
        shouldEndRound
    };
}

module.exports = {
    createRoundCompletion
};
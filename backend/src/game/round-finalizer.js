function createRoundFinalizer({
    roundCompletion,
    patternLockManager,
    roundTransition,
    createEmptyPattern,
    instrumentRepository
}) {
    async function finalizeRound({
        runtime,
        matchId,
        now
    }) {
        if(!roundCompletion.shouldEndRound(runtime, now)){
            return {
                completed: false,
                runtime
            };
        }


        for( const [playerId, playerState] of runtime.players){
            if(!playerState.locked){

                if(!playerState.draftPattern){
                
                    const instrument = await instrumentRepository.findById(runtime.currentInstrumentId)
                    
                    if(!instrument) return {completed : false, runtime: runtime};
                    playerState.draftPattern = createEmptyPattern({
                        instrumentCode: instrument.code,
                        instrumentCategory: instrument.category,
                        stepCount: runtime.stepCount
                    });
                }

                const result = await patternLockManager.lockPattern({runtime, playerId, matchId});
    
                if (!result.success) return { completed: false, runtime: runtime};
            }
        }

        roundTransition.advanceAfterRound(runtime);

        return {
            completed: true,
            runtime: runtime
        }
    }

    return {
        finalizeRound
    };
}

module.exports = {
    createRoundFinalizer
};

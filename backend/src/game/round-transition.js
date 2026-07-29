
function createRoundTransition({ phaseStateMachine }) {
    function advanceAfterRound(runtime) {


        if(runtime.phase !== "INSTRUMENT_ROUND") throw new Error("instrument roundunda degilsin.");

        if(runtime.currentInstrumentIndex >= runtime.sessionInstrumentIds.length - 1) {
            phaseStateMachine.transition(runtime, "MATCH_BUILDING");
            runtime.currentInstrumentId = null;
            return runtime;
        }
        else{
        runtime.currentInstrumentIndex++;
        runtime.currentInstrumentId = null;
        phaseStateMachine.transition(runtime, "NEXT_INSTRUMENT");
        return runtime;
        }

        


    }

    return {
        advanceAfterRound
    };
}

module.exports = {
    createRoundTransition
};
function createInstrumentRoundManager({ phaseStateMachine }) {
    function startRound({
        runtime,
        instrumentRoundSeconds,
        now = new Date()
    }) {

        runtime.currentInstrumentId = runtime.sessionInstrumentIds[runtime.currentInstrumentIndex];
        if(runtime.currentInstrumentId === null || runtime.currentInstrumentId === undefined){
            
            throw new Error("gecersiz instrument");
        }
        
        runtime = phaseStateMachine.transition(runtime, "INSTRUMENT_ROUND");

        
        runtime.roundStartedAt = new Date(now);

        runtime.deadlineAt = new Date(runtime.roundStartedAt.getTime() + instrumentRoundSeconds * 1000);

        for (const [playerId, playerState] of runtime.players){
            runtime.players.set(playerId,{
                playerId:playerId,
                draftPattern: null,
                locked: false,
                connected: playerState.connected,
                ready: false,
                reconnectCount: playerState.reconnectCount ?? 0,
                reconnectDeadlineAt: null,
                roundSkipped: false
            })
        }

        return runtime;

    }

    return {
        startRound
    };
}

module.exports = {
    createInstrumentRoundManager
};

function createSessionGameFlow({
    sessionReadiness,
    instrumentRoundManager
}) {
    function handlePlayerReady({
        runtime,
        playerId,
        instrumentRoundSeconds,
        now
    }) {
        const player = runtime.players.get(playerId);
        
        if(!player){
            throw new Error("oyuncu bulunamadi");
        }

        sessionReadiness.markPlayerReady(runtime, playerId);

        const allReady = sessionReadiness.areAllPlayersReady(runtime);

        if(!allReady){
            return {
                runtime: runtime,
                started: false
            }
        }
        
        runtime = instrumentRoundManager.startRound({
            runtime: runtime,
            instrumentRoundSeconds: instrumentRoundSeconds,
            now: now
        });

        return {
            runtime: runtime,
            started: true
        }

    }

    return {
        handlePlayerReady
    };
}

module.exports = {
    createSessionGameFlow
};
function createSessionReadiness() {
    function markPlayerReady(runtime, playerId) {
        if(runtime.phase !== "MATCH_STARTING"){
            throw new Error("mac henuz baslamiyor.");
        }

        if(!runtime.players.has(playerId)){
            throw new Error("oyuncu bulanamadi!");
        }

        const player = runtime.players.get(playerId);

        player.ready = true;

        runtime.stateVersion++;
        
        return runtime;

    }

    function areAllPlayersReady(runtime) {

        if(runtime.players.size === 0) return false;

        for( const [playerId, playerState] of runtime.players) {
            const player = runtime.players.get(playerId);

            if(player.ready === false) return false;
        }

        return true;
    }

    return {
        markPlayerReady,
        areAllPlayersReady
    };
}

module.exports = {
    createSessionReadiness
};
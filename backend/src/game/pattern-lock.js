
function createPatternLockManager({ patternService }) {
    async function lockPattern({
        runtime,
        playerId,
        matchId
    }) {

        if(runtime.phase !== "INSTRUMENT_ROUND"){
            throw new Error("draft kilitlenemez, cunku phase INSTRUMENT_ROUND degil.");
        }

        if(!runtime.players.has(playerId)){
            throw new Error("oyuncu bulunamadi!");
        }

        const player = runtime.players.get(playerId);
        
        if(player.locked){
            throw new Error("oyuncu drafti zaten locklamis.");
        }

        const draftPattern = player.draftPattern;
        
        if(!draftPattern){
            throw new Error("oyuncunun draftPattern'i yok, locklanamaz.");
        }

        const result = await patternService.submitPattern({
            playerId: playerId,
            matchId: matchId,
            instrumentId: runtime.currentInstrumentId,
            patternData: draftPattern
        })

        if(!result.success){
            return {
                success:false,
                runtime,
                error: result.error
            };
        }

        player.locked = true;

        runtime.stateVersion++;

        return {
            success:true,
            runtime,
            pattern: result.pattern
        };
    }

    return {
        lockPattern
    };
}

module.exports = {
    createPatternLockManager
};
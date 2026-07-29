function createDraftPatternManager() {
    function updateDraft({
        runtime,
        playerId,
        patternData
    }) {

        if(runtime.phase !== "INSTRUMENT_ROUND"){
            throw new Error("draft yapilamaz, cunku phase INSTRUMENT_ROUND degil.");
        }

        if(!runtime.players.has(playerId)){
            throw new Error("oyuncu bulunamadi!");
        }

        const player = runtime.players.get(playerId);

        if(player.locked){
            throw new Error("oyuncu drafti locklamis, guncelleyemez.");
        }

        if(!patternData || typeof patternData !== 'object' || Array.isArray(patternData)|| !Object.keys(patternData).length){
            throw new Error("gecersiz patternData");
        }

        player.draftPattern = patternData;
        runtime.stateVersion++;
        
        return  runtime;
    }

    return {
        updateDraft
    };
}

module.exports = {
    createDraftPatternManager
};
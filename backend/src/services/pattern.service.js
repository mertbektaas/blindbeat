const { validatePattern } = require("../validation/pattern.schemas");

function createPatternService({ patternRepository }) {
    return {
        async submitPattern({
            playerId,
            matchId,
            instrumentId,
            patternData
        }) {
            const validation = validatePattern(patternData);

            if(!validation.valid){
                return {
                    success: false,
                    error: validation.error
                };
            }

            const savedPattern = 
                await patternRepository.createPattern({
                    playerId,
                    matchId,
                    instrumentId,
                    patternData: validation.data
                });

            return {
                success: true,
                pattern: savedPattern
            }
        }
    }
}

module.exports = {
    createPatternService
}
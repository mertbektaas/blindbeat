function createPatternRepository(prisma) {
    return {
        createPattern({
            playerId,
            matchId,
            instrumentId,
            patternData
        })
        {
            return prisma.pattern.create({
                data: {
                    playerId,
                    matchId,
                    instrumentId,
                    patternData
                }
            });
        },

        findActiveByInstrument(instrumentId){
    return prisma.pattern.findMany({
        where: {
            instrumentId,
            poolStatus : "ACTIVE"
        },
        orderBy: {
            createdAt: "asc"
        }
    });  
        },

        updatePoolStatus(patternId, poolStatus ){
        return prisma.pattern.update({
            where: {
                id: patternId
            },
            data: {
                poolStatus: poolStatus
            }
    });

        }
    }
}







module.exports = {
    createPatternRepository,
}
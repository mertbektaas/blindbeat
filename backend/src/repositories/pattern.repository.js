const { PatternPoolStatus } = require("@prisma/client");

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

        },

        getAllActivePatterns(sessionId,instrumentIds){
            return prisma.pattern.findMany({
                where:{
                    instrumentId: {in: instrumentIds},
                    poolStatus: PatternPoolStatus.ACTIVE,
                    match:{
                    sessionId
                }
                },
                
                orderBy:{
                    createdAt : "asc"
                }
            })
        },

        updatePoolStatusMany({
            patternIds,
            poolStatus
        }){
            return prisma.pattern.updateMany({
                where:{
                    id: {in : patternIds }
                },
                data:{
                    poolStatus: poolStatus
                }
            })
        },

        findArchivedBySessionAndPlayers({
            sessionId,
            playerIds,
            instrumentIds,
            excludedPatternIds = []
        }) {
            return prisma.pattern.findMany({
                where: {
                    poolStatus: PatternPoolStatus.ARCHIVE,
                    playerId: { in: playerIds },
                    instrumentId: { in: instrumentIds },
                    match: {
                        sessionId
                    },
                    ...(excludedPatternIds.length > 0
                        ? { id: { notIn: excludedPatternIds } }
                        : {})
                },
                orderBy: {
                    createdAt: "asc"
                }
            });
        }
    }
}







module.exports = {
    createPatternRepository,
}

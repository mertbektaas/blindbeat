function createMatchRepository(prisma){
    return {
        createMatch({
            sessionId,
            matchNumber
        }){
            return prisma.match.create({
                data:{
                    sessionId:sessionId,
                    matchNumber:matchNumber
                }
            })
        },

        findMatchById(matchId){
            return prisma.match.findUnique({
                where:{
                    id: matchId
                }
            });
        },

        findMatchBySessionAndNumber({
            sessionId,
            matchNumber
        }){
            return prisma.match.findUnique({
                where:{
                    sessionId_matchNumber:{
                        sessionId: sessionId,
                        matchNumber:matchNumber
                    }
                }
            })
        },

        deleteMatch(matchId) {
            return prisma.match.delete({
                where: {
                    id: matchId
                }
            });
        }
    }
}

module.exports = {
    createMatchRepository
}

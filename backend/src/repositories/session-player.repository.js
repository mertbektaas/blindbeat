function createSessionPlayerRepository(prisma) {
    return {
        createMany({
            sessionId,
            playerIds
        }) {
            // playerIds listesini SessionPlayer kayıtlarına dönüştür
            // prisma.sessionPlayer.createMany
            const data = playerIds.map(playerId => ({
            sessionId,
            playerId
        }));
            return prisma.sessionPlayer.createMany({
                data
            })
        },

        findBySessionId(sessionId) {
            // session oyuncularını player ilişkisiyle getir
            // joinedAt asc sırasıyla dönsün
            return prisma.sessionPlayer.findMany({
                where:{
                    sessionId: sessionId
                },
                include:{
                    player:true
                },
                orderBy:{
                    joinedAt: "asc"
                }
            })
        },

        findBySessionAndPlayer({
            sessionId,
            playerId
        }) {
            // composite primary key ile tek kaydı getir
            return prisma.sessionPlayer.findUnique({
                where:{
                    sessionId_playerId:{
                    sessionId,
                    playerId
                    }

                }
            })
        },

        countBySessionId(sessionId) {
            // sessiondaki oyuncu sayısını getir
            // prisma.sessionPlayer.count
            return prisma.sessionPlayer.count({
                where:{
                    sessionId:sessionId
                }
            })
        }
    };
}

module.exports = {
    createSessionPlayerRepository
};
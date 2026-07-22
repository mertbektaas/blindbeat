function createSessionRepository(prisma) {
    return {
        createSession({
            lobbyId,
            maxMatchCount,
            bpm,
            stepCount,
            instrumentRoundSeconds,
            playbackLoops,
            songVariantCount,
            status
        }) {
            return prisma.session.create({
                data:{
                    lobbyId,
                    maxMatchCount,
                    bpm,
                    stepCount,
                    instrumentRoundSeconds,
                    playbackLoops,
                    songVariantCount,
                    status
                }
            });
        },

        findById(sessionId) {
            return prisma.session.findUnique({
                where:{
                    id: sessionId
                }
            });
        },

        findByIdWithInstruments(sessionId) {
            // session + sessionInstruments + instrument ilişkisini getir
            // instrument sırası orderNo asc olacak
            return prisma.session.findUnique({
                where:{
                    id: sessionId
                },
                include:{
                    sessionInstruments:{
                        include:{
                            instrument: true
                        },
                        orderBy: {
                            orderNo: "asc"
                        }
                    }
                }
            })
        },

        findByLobbyAndStatus({
            lobbyId,
            status
        }) {
            // belirli lobbyde belirli durumdaki sessionı bul
            return prisma.session.findFirst({
                where:{
                    lobbyId:lobbyId,
                    status: status
                },
                orderBy:{
                    createdAt: "desc"
                }
            })

        },

        updateStatus(sessionId, status) {
            // prisma.session.update
            return prisma.session.update({
                where:{
                    id: sessionId
                },
                data:{
                    status: status
                }
            })
        }
    };
}

module.exports = {
    createSessionRepository
};
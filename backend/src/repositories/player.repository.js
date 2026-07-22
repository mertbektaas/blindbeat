function createPlayerRepository(prisma) {
    return {
        createPlayer({
            nickname,
            lobbyId
        }) {
            return prisma.player.create({
                    data: {
                        nickname: nickname,
                        lobbyId: lobbyId
                    }
            })
        },

        findByLobbyAndNickname({
            lobbyId,
            nickname
        }) {
            return prisma.player.findUnique({
                where:{
                    lobbyId_nickname: {
                        lobbyId,
                        nickname
                    }
                }
            })
        },

        findByIdWithLobby(playerId) {
            return prisma.player.findUnique({
                where:{
                    id: playerId
                },
                include: {
                    lobby: true
                }
            })
        },

        findAllByLobbyId(lobbyId) {
            // lobbydeki oyuncuları createdAt sırasıyla getir
            return prisma.player.findMany({
                where:{
                    lobbyId:lobbyId
                },
                orderBy:{
                    createdAt: "asc"
                }
            })
        },

        deleteById(playerId) {
            // prisma.player.delete
            return prisma.player.delete({
                where: {
                    id: playerId
                }
            })
        }
    };
}

module.exports = {
    createPlayerRepository
};
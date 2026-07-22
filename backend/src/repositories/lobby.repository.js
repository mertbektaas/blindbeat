const { LobbyStatus } = require("@prisma/client");

function createLobbyRepository(prisma) {
    return {
        createLobby(code, status) {
            return prisma.lobby.create({
                data: {
                    code: code,
                    status: status
                }
            })
        },

        findByCode(code) {
            return prisma.lobby.findUnique({
                where:{
                    code: code
                }
            });
        },

        findByCodeWithPlayers(code) {
            return prisma.lobby.findUnique({
                where: {
                    code : code
            }, 
                include: { 
                    players : true}
            });
        },

        updateStatus(lobbyId, status) {
            return prisma.lobby.update({
                where:{
                    id: lobbyId
                },
                data: {
                    status: status
                }
            })
        },

        deleteById(lobbyId) {
            return prisma.lobby.delete({
                where:{
                    id: lobbyId
                }
            });
        }
    };
}

module.exports = {
    createLobbyRepository
};
function createConnectionRegistry() {
    const socketByPlayerId = new Map();
    const playerIdBySocket = new Map();

    function add(playerId, socket) {
        const previousSocket = socketByPlayerId.get(playerId);

        if (previousSocket) {
            playerIdBySocket.delete(previousSocket);
        }

        socketByPlayerId.set(playerId, socket);
        playerIdBySocket.set(socket, playerId);

        return previousSocket;
    }

    function getSocketByPlayerId(playerId) {
        return socketByPlayerId.get(playerId);
    }

    function removeBySocket(socket) {

        const playerId = playerIdBySocket.get(socket);

        if(playerId === undefined) return undefined;

        playerIdBySocket.delete(socket);
        socketByPlayerId.delete(playerId);

        return playerId;

    }

    return {
        add,
        getSocketByPlayerId,
        removeBySocket
    };
}

module.exports = {
    createConnectionRegistry
};

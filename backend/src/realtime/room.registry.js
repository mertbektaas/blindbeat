function createRoomRegistry() {
    const roomByLobbyId = new Map();

    function getOrCreateRoom(lobbyId, lobbyCode) {

        const room = roomByLobbyId.get(lobbyId);

        if(room){
            return room;
        }

        else{
            const room = ({
                lobbyId: lobbyId,
                lobbyCode: lobbyCode,
                onlinePlayerIds: new Set(),
                stateVersion: 0,
                activeSessionId: null,
                phase: "LOBBY"
            });

            roomByLobbyId.set(lobbyId, room);

            return room;
        }
    }

    function getRoom(lobbyId) {
        return roomByLobbyId.get(lobbyId);
    }

    function addPlayer(lobbyId, lobbyCode, playerId) {
        const room = getOrCreateRoom(lobbyId, lobbyCode);

        room.onlinePlayerIds.add(playerId);

        return room;


    }

    function removePlayer(lobbyId, playerId) {

        const room = roomByLobbyId.get(lobbyId);

        if(!room) {
            return undefined;
        }

        else{
            room.onlinePlayerIds.delete(playerId);
            return room;
        }
    }

    function deleteRoom(lobbyId) {
        roomByLobbyId.delete(lobbyId);
    }

    return {
        getOrCreateRoom,
        getRoom,
        addPlayer,
        removePlayer,
        deleteRoom
    };
}

module.exports = {
    createRoomRegistry
};
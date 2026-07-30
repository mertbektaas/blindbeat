function createRoomRegistry() {
    const roomByLobbyId = new Map();

    const defaultLobbyConfig = Object.freeze({
        bpm: 80,
        instrumentRoundSeconds: 30,
        stepCount: 16,
        maxMatchCount: 3
    });

    function createDefaultPattern(nickname, stepCount) {
        const seed = [...nickname].reduce(
            (total, character) => total + character.charCodeAt(0),
            0
        );

        return Array.from(
            { length: stepCount },
            (_, index) => ((seed + index * 7) % 11) < 3
        );
    }

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
                phase: "LOBBY",
                hostPlayerId: null,
                readyPlayerIds: new Set(),
                lobbyConfig: { ...defaultLobbyConfig },
                lobbyPatterns: {}
            });

            roomByLobbyId.set(lobbyId, room);

            return room;
        }
    }

    function initializeLobby({ lobbyId, lobbyCode, hostPlayerId }) {
        const room = getOrCreateRoom(lobbyId, lobbyCode);

        room.hostPlayerId = hostPlayerId;

        return room;
    }

    function ensureLobbyState({ lobbyId, lobbyCode, players }) {
        const room = getOrCreateRoom(lobbyId, lobbyCode);

        if (!room.hostPlayerId && players[0]) {
            room.hostPlayerId = players[0].id;
        }

        const stepCount = room.lobbyConfig.stepCount;

        for (const player of players) {
            const currentPattern = room.lobbyPatterns[player.id];

            if (currentPattern?.length === stepCount) {
                continue;
            }

            room.lobbyPatterns[player.id] = currentPattern
                ? Array.from(
                    { length: stepCount },
                    (_, index) => currentPattern[index] ?? false
                )
                : createDefaultPattern(player.nickname, stepCount);
        }

        return room;
    }

    function updateLobbyPattern({ lobbyId, playerId, pattern }) {
        const room = roomByLobbyId.get(lobbyId);

        if (!room) {
            return null;
        }

        room.lobbyPatterns[playerId] = [...pattern];

        return room;
    }

    function updateLobbyConfig({ lobbyId, config }) {
        const room = roomByLobbyId.get(lobbyId);

        if (!room) {
            return null;
        }

        room.lobbyConfig = {
            ...room.lobbyConfig,
            ...config
        };

        const stepCount = room.lobbyConfig.stepCount;

        for (const [playerId, pattern] of Object.entries(room.lobbyPatterns)) {
            room.lobbyPatterns[playerId] = Array.from(
                { length: stepCount },
                (_, index) => pattern[index] ?? false
            );
        }

        return room;
    }

    function setLobbyPlayerReady({ lobbyId, playerId, ready }) {
        const room = roomByLobbyId.get(lobbyId);

        if (!room) {
            return null;
        }

        if (ready) {
            room.readyPlayerIds.add(playerId);
        } else {
            room.readyPlayerIds.delete(playerId);
        }

        return room;
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

    function removeLobbyPlayerState({
        lobbyId,
        playerId,
        nextHostPlayerId = null
    }) {
        const room = roomByLobbyId.get(lobbyId);

        if (!room) {
            return undefined;
        }

        room.onlinePlayerIds.delete(playerId);
        room.readyPlayerIds.delete(playerId);
        delete room.lobbyPatterns[playerId];

        if (room.hostPlayerId === playerId) {
            room.hostPlayerId = nextHostPlayerId;
        }

        return room;
    }

    function deleteRoom(lobbyId) {
        roomByLobbyId.delete(lobbyId);
    }

    function setActiveSession({
        lobbyId,
        lobbyCode,
        sessionId
    }) {
        const room = getOrCreateRoom(lobbyId, lobbyCode);

        room.activeSessionId = sessionId;

        return room;
    }

    function clearActiveSession(lobbyId) {
        const room = roomByLobbyId.get(lobbyId);

        if (!room) {
            return false;
        }

        room.activeSessionId = null;

        return true;
    }

    return {
        getOrCreateRoom,
        initializeLobby,
        ensureLobbyState,
        updateLobbyPattern,
        updateLobbyConfig,
        setLobbyPlayerReady,
        getRoom,
        addPlayer,
        removePlayer,
        removeLobbyPlayerState,
        deleteRoom,
        setActiveSession,
        clearActiveSession
    };
}

module.exports = {
    createRoomRegistry
};

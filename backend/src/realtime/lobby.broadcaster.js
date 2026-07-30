function createLobbyBroadcaster({
    prisma,
    roomRegistry,
    connectionRegistry
}) {
    async function loadLobby(lobbyId) {
        return prisma.lobby.findUnique({
            where: {
                id: lobbyId
            },
            select: {
                code: true,
                status: true,
                players: {
                    select: {
                        id: true,
                        nickname: true
                    }
                }
            }
        });
    }

    function createSnapshotPayload(lobby, room) {
        roomRegistry.ensureLobbyState({
            lobbyId: room.lobbyId,
            lobbyCode: lobby.code,
            players: lobby.players
        });

        return {
            code: lobby.code,
            status: lobby.status,
            hostPlayerId: room.hostPlayerId,
            config: room.lobbyConfig,
            patterns: room.lobbyPatterns,
            players: lobby.players.map((player) => ({
                id: player.id,
                nickname: player.nickname,
                online: room.onlinePlayerIds.has(player.id),
                ready: room.readyPlayerIds.has(player.id)
            }))
        };
    }

    async function sendLobbySnapshot({ lobbyId, playerId }) {
        const room = roomRegistry.getRoom(lobbyId);

        if (!room) {
            return {
                sent: false
            };
        }

        const lobby = await loadLobby(lobbyId);

        if (!lobby) {
            roomRegistry.deleteRoom(lobbyId);

            return {
                sent: false
            };
        }

        const socket = connectionRegistry.getSocketByPlayerId(playerId);

        if (!socket || socket.readyState !== 1) {
            return {
                sent: false
            };
        }

        socket.send(JSON.stringify({
            type: "lobby:snapshot",
            stateVersion: room.stateVersion,
            payload: createSnapshotPayload(lobby, room)
        }));

        return {
            sent: true,
            stateVersion: room.stateVersion
        };
    }

    async function broadcastLobbyEvent({
        lobbyId,
        type,
        changedPlayer,
        excludePlayerId
    }) {
        const room = roomRegistry.getRoom(lobbyId);

        if (!room) {
            return {
                sentCount: 0
            };
        }

        const lobby = await loadLobby(lobbyId);

        if (!lobby) {
            roomRegistry.deleteRoom(lobbyId);

            return {
                sentCount: 0
            };
        }

        room.stateVersion += 1;

        const message = JSON.stringify({
            type,
            stateVersion: room.stateVersion,
            payload: {
                ...createSnapshotPayload(lobby, room),
                changedPlayer
            }
        });

        let sentCount = 0;

        for (const playerId of room.onlinePlayerIds) {
            if (playerId === excludePlayerId) {
                continue;
            }

            const socket = connectionRegistry.getSocketByPlayerId(playerId);

            if (socket && socket.readyState === 1) {
                socket.send(message);
                sentCount += 1;
            }
        }

        return {
            sentCount,
            stateVersion: room.stateVersion
        };
    }

    return {
        broadcastLobbyEvent,
        sendLobbySnapshot
    };
}

module.exports = {
    createLobbyBroadcaster
};

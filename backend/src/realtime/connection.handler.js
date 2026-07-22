function createConnectionHandler({
    readPlayerSessionToken,
    identityRegistry,
    prisma,
    connectionRegistry,
    roomRegistry,
    lobbyBroadcaster
}) {
    return async function handleConnection(socket, request) {
        const token = readPlayerSessionToken(
            request.headers.cookie
        );

        const identity = identityRegistry.get(token);

        if (!identity) {
            socket.close(1008, "IDENTITY_NOT_FOUND");
            return;
        }

        const lobby = await prisma.lobby.findUnique({
            where: {
                id: identity.lobbyId
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

        if (!lobby) {
            socket.close(1008, "LOBBY_NOT_FOUND");
            return;
        }

        const previousSocket = connectionRegistry.add(
            identity.playerId,
            socket
        );

        if (previousSocket) {
            previousSocket.close();
        }

        const room = roomRegistry.addPlayer(
            identity.lobbyId,
            lobby.code,
            identity.playerId
        );

        socket.send(JSON.stringify({
            type: "connection:ready",
            payload: {
                nickname: identity.nickname
            }
        }));

        socket.send(JSON.stringify({
            type: "lobby:snapshot",
            stateVersion: room.stateVersion,
            payload: {
                code: lobby.code,
                status: lobby.status,
                players: lobby.players.map((player) => ({
                    nickname: player.nickname,
                    online: room.onlinePlayerIds.has(player.id)
                }))
            }
        }));

        if (lobbyBroadcaster) {
            await lobbyBroadcaster.broadcastLobbyEvent({
                lobbyId: identity.lobbyId,
                type: "lobby:player-connected",
                changedPlayer: {
                    nickname: identity.nickname,
                    action: "connected"
                },
                excludePlayerId: identity.playerId
            });
        }

        socket.on("close", async (code) => {
            const removedPlayerId = connectionRegistry.removeBySocket(socket);

            if (removedPlayerId === undefined) {
                return;
            }

            const room = roomRegistry.removePlayer(
                    identity.lobbyId,
                    removedPlayerId
            );

            if (
                code !== 1000 &&
                room &&
                lobbyBroadcaster
            ) {
                await lobbyBroadcaster.broadcastLobbyEvent({
                    lobbyId: identity.lobbyId,
                    type: "lobby:player-disconnected",
                    changedPlayer: {
                        nickname: identity.nickname,
                        action: "disconnected"
                    }
                });
            }
        });

        socket.on("message", async (rawMessage) => {
            let message;

            try {
                message = JSON.parse(rawMessage.toString());
            } catch (error) {
                socket.send(JSON.stringify({
                    type: "error",
                    payload: {
                        code: "INVALID_MESSAGE"
                    }
                }));
                return;
            }

            if (message.type !== "lobby:request-snapshot") {
                return;
            }

            if (lobbyBroadcaster) {
                await lobbyBroadcaster.sendLobbySnapshot({
                    lobbyId: identity.lobbyId,
                    playerId: identity.playerId
                });
            }
        });
    };
}

module.exports = {
    createConnectionHandler
};

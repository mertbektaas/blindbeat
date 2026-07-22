const { success } = require("../response");


function createLobbyController({
    lobbyService,
    sessionService,
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie,
    identityRegistry,
    lobbyBroadcaster,
    roomRegistry,
    connectionRegistry
}) {
    return {
        async createLobby(req, res, next) {
            try {
                const nickname = req.body.nickname;

                const result = await lobbyService.createLobby({
                    nickname
                });

                const cookie = createPlayerSessionCookie(
                    result.identity.token
                );

                const { identity, ...publicResult } = result;

                res
                    .status(201)
                    .setHeader("Set-Cookie", [cookie])
                    .json(success(publicResult, req.requestId));
            } catch (error) {
                next(error);
            }
        },

        async joinLobby(req, res, next) {
    try {
        const lobbyCode = req.params.lobbyCode;
        const nickname = req.body.nickname;

        const result = await lobbyService.joinLobby({
            lobbyCode,
            nickname
        });

        const cookie = createPlayerSessionCookie(
            result.identity.token
        );

        if (lobbyBroadcaster) {
            await lobbyBroadcaster.broadcastLobbyEvent({
                lobbyId: result.lobby.id,
                type: "lobby:player-joined",
                changedPlayer: {
                    nickname: result.player.nickname,
                    action: "joined"
                }
            });
        }

        const { identity, ...publicResult } = result;

        res
            .status(201)
            .setHeader("Set-Cookie", [cookie])
            .json(success(publicResult, req.requestId));
    } catch (error) {
        next(error);
    }
        },

        async leaveLobby(req, res, next) {
        try {
        const lobbyCode = req.params.lobbyCode;

        const token = readPlayerSessionToken(
            req.headers.cookie
        );

        const identity = identityRegistry.get(token);

        const result = await lobbyService.leaveLobby({
            lobbyCode,
            identity,
            token
        });

        if (identity && roomRegistry) {
            roomRegistry.removePlayer(
                identity.lobbyId,
                identity.playerId
            );
        }

        if (identity && connectionRegistry) {
            const socket = connectionRegistry.getSocketByPlayerId(
                identity.playerId
            );

            if (socket) {
                socket.close(1000, "LOBBY_LEFT");
            }
        }

        if (identity && result.lobbyDeleted && roomRegistry) {
            roomRegistry.deleteRoom(identity.lobbyId);
        }

        if (
            identity &&
            !result.lobbyDeleted &&
            lobbyBroadcaster
        ) {
            await lobbyBroadcaster.broadcastLobbyEvent({
                lobbyId: identity.lobbyId,
                type: "lobby:player-left",
                changedPlayer: {
                    nickname: identity.nickname,
                    action: "left"
                }
            });
        }

        const clearedCookie = clearPlayerSessionCookie();

        res
            .status(200)
            .setHeader("Set-Cookie", [clearedCookie])
            .json(success(result, req.requestId));
    } catch (error) {
        next(error);
    }
        },

        async startSession(req, res, next) {
            try {
                const lobbyCode = req.params.lobbyCode;

                const token = readPlayerSessionToken(
                    req.headers.cookie
                );

                const identity = identityRegistry.get(token);

                const config = req.body;

                const result = await sessionService.startSession({
                    lobbyCode,
                    identity,
                    config
                });

                res
                    .status(201)
                    .json(success(result, req.requestId));
            } catch (error) {
                next(error);
            }
        }
    };
}

module.exports = {
    createLobbyController
};

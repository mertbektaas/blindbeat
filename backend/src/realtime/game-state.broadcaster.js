function createGameStateBroadcaster({
    runtimeRegistry,
    connectionRegistry,
    createGameStateSnapshot
}) {
    function sendGameStateSnapshot({
        sessionId,
        playerId
    }) {
        const runtime = runtimeRegistry.getRuntime(sessionId);

        if(!runtime || !runtime.players.has(playerId)) {
            return {sent: false}
        }

        const socket = connectionRegistry.getSocketByPlayerId(playerId);

        if(!socket || socket.readyState !== 1) {
            return {sent: false};
        }

        const snapshot = createGameStateSnapshot(runtime, playerId)

        const msg = JSON.stringify({
            type: "game:state",
            payload: snapshot
        });
        socket.send(msg);

        return {
            sent: true,
            stateVersion: runtime.stateVersion
        }
    }

    function broadcastGameState(sessionId) {
        let count = 0;

        const runtime = runtimeRegistry.getRuntime(sessionId);
        if(!runtime) return { sentCount: 0 };

        for (const [playerId] of runtime.players){
            const result = sendGameStateSnapshot({sessionId, playerId});
            if (result.sent) count++;
        }

        return {
            sentCount: count
        }
    }

    return {
        sendGameStateSnapshot,
        broadcastGameState
    };
}

module.exports = {
    createGameStateBroadcaster
};
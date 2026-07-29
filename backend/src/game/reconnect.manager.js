function createReconnectManager({
    instrumentRoundSeconds,
    maxReconnectCount = 2,
    now = () => new Date()
}) {
    function getPlayerState(runtime, playerId) {
        const playerState = runtime.players.get(playerId);

        if (!playerState) {
            throw new Error("Oyuncu bulunamadı.");
        }

        return playerState;
    }

    function markDisconnected({ runtime, playerId }) {
        const playerState = getPlayerState(runtime, playerId);
        const disconnectedAt = new Date(now());

        playerState.connected = false;
        playerState.reconnectCount += 1;
        playerState.reconnectDeadlineAt = new Date(
            disconnectedAt.getTime() + instrumentRoundSeconds * 1000
        );

        if (
            runtime.phase === "INSTRUMENT_ROUND" &&
            runtime.deadlineAt &&
            playerState.reconnectDeadlineAt > runtime.deadlineAt
        ) {
            runtime.deadlineAt = playerState.reconnectDeadlineAt;
        }

        if (playerState.reconnectCount > maxReconnectCount) {
            playerState.roundSkipped = true;
        }

        runtime.stateVersion += 1;

        return {
            reconnectCount: playerState.reconnectCount,
            reconnectAllowed: playerState.reconnectCount <= maxReconnectCount,
            roundSkipped: playerState.roundSkipped,
            reconnectDeadlineAt: playerState.reconnectDeadlineAt
        };
    }

    function markReconnected({ runtime, playerId }) {
        const playerState = getPlayerState(runtime, playerId);

        if (playerState.reconnectCount > maxReconnectCount) {
            return {
                reconnected: false,
                reconnectAllowed: false,
                roundSkipped: true,
                reason: "RECONNECT_LIMIT_REACHED"
            };
        }

        playerState.connected = true;
        playerState.reconnectDeadlineAt = null;
        runtime.stateVersion += 1;

        return {
            reconnected: true,
            reconnectAllowed: true,
            roundSkipped: playerState.roundSkipped
        };
    }

    return {
        markDisconnected,
        markReconnected
    };
}

module.exports = {
    createReconnectManager
};

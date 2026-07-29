function createRequestIdRegistry({ maxEntriesPerPlayer = 100 } = {}) {
    const requestIdsByPlayer = new Map();

    function claim({ playerId, requestId }) {
        if (!requestId) {
            return {
                tracked: false,
                duplicate: false
            };
        }

        let requestIds = requestIdsByPlayer.get(playerId);

        if (!requestIds) {
            requestIds = new Set();
            requestIdsByPlayer.set(playerId, requestIds);
        }

        if (requestIds.has(requestId)) {
            return {
                tracked: true,
                duplicate: true
            };
        }

        requestIds.add(requestId);

        while (requestIds.size > maxEntriesPerPlayer) {
            requestIds.delete(requestIds.values().next().value);
        }

        return {
            tracked: true,
            duplicate: false
        };
    }

    function clearPlayer(playerId) {
        return requestIdsByPlayer.delete(playerId);
    }

    return {
        claim,
        clearPlayer
    };
}

module.exports = {
    createRequestIdRegistry
};

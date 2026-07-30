function createGameStateMessageHandler({
    votingStore,
    onGameState = () => {}
}) {
    function handleMessage(message) {
        if (message?.type !== "game:state") {
            return {
                handled: false
            };
        }

        const state = message.payload || {};

        const variantOrderChanged =
            JSON.stringify(votingStore?.variantOrder || []) !==
            JSON.stringify(state.variantOrder || []);

        if (
            state.phase === "VOTING" &&
            (votingStore?.phase !== "VOTING" || variantOrderChanged)
        ) {
            votingStore?.openVoting(state.variantOrder || []);
        }

        if (state.matchResult) {
            votingStore?.setMatchResult(state.matchResult);
        }

        if (state.sessionResult) {
            votingStore?.setSessionResult(state.sessionResult);
        }

        onGameState(state);

        return {
            handled: true,
            state
        };
    }

    return {
        handleMessage
    };
}

export {
    createGameStateMessageHandler
};

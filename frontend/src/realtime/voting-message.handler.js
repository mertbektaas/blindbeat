function createVotingMessageHandler({
    votingStore,
    onVoteAck = () => {}
}) {
    function handleMessage(message) {
        if (message?.type !== "vote:ack") {
            return {
                handled: false
            };
        }

        votingStore?.markVoteSubmitted(message.payload || {});
        onVoteAck(message.payload || {});

        return {
            handled: true,
            payload: message.payload || {}
        };
    }

    return {
        handleMessage
    };
}

export {
    createVotingMessageHandler
};

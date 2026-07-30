function createGameSocket({
    url,
    onOpen = () => {},
    onMessage = () => {},
    onClose = () => {},
    onError = () => {}
} = {}) {
    let socket = null;

    function connect() {
        if (
            socket &&
            (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)
        ) {
            return socket;
        }

        socket = new WebSocket(url);

        socket.addEventListener("open", onOpen);
        socket.addEventListener("error", onError);
        socket.addEventListener("close", (event) => {
            onClose(event);
            socket = null;
        });
        socket.addEventListener("message", (event) => {
            try {
                onMessage(JSON.parse(event.data));
            } catch (error) {
                onError(error);
            }
        });

        return socket;
    }

    function send(message) {
        if (!socket || socket.readyState !== 1) {
            throw new Error("WebSocket is not connected.");
        }

        socket.send(JSON.stringify(message));
    }

    function sendPlaybackReady({ requestId }) {
        send({
            type: "playback:ready",
            requestId,
            payload: {}
        });
    }

    function sendPlaybackComplete({ requestId }) {
        send({
            type: "playback:complete",
            requestId,
            payload: {}
        });
    }

    function sendVote({ requestId, songVariantId }) {
        send({
            type: "vote:submit",
            requestId,
            payload: {
                songVariantId
            }
        });
    }

    function sendPlayerReady({ requestId }) {
        send({
            type: "game:player-ready",
            requestId,
            payload: {}
        });
    }

    function sendMatchContinue({ requestId }) {
        send({
            type: "match:continue",
            requestId,
            payload: {}
        });
    }

    function sendDraftUpdate({ requestId, patternData }) {
        send({
            type: "pattern:draft-update",
            requestId,
            payload: {
                patternData
            }
        });
    }

    function sendPatternLock({ requestId }) {
        send({
            type: "pattern:lock",
            requestId,
            payload: {}
        });
    }

    function close() {
        if (!socket) {
            return;
        }

        socket.close(1000, "CLIENT_CLOSED");
        socket = null;
    }

    function isOpen() {
        return socket?.readyState === 1;
    }

    return {
        connect,
        send,
        sendPlaybackReady,
        sendPlaybackComplete,
        sendVote,
        sendPlayerReady,
        sendMatchContinue,
        sendDraftUpdate,
        sendPatternLock,
        close,
        isOpen
    };
}

export {
    createGameSocket
};

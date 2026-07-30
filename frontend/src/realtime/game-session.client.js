import { createGameSocket } from "./game-socket.js";
import { createPlaybackMessageHandler } from "./playback-message.handler.js";
import { createVotingMessageHandler } from "./voting-message.handler.js";
import { createGameStateMessageHandler } from "./game-state.message.handler.js";

function createGameSessionClient({
    url,
    playbackController,
    getVariants,
    getInstrumentsById,
    loadPlayback,
    playbackStore,
    progressTracker,
    votingStore,
    createRequestId = () => crypto.randomUUID(),
    onMessage = () => {},
    onPlaybackStart = () => {},
    onVoteAck = () => {},
    onGameState = () => {},
    onOpen = () => {},
    onClose = () => {},
    onError = () => {}
}) {
    let playbackSequenceId = 0;
    let playbackTimerId = null;

    function clearPlaybackTimer() {
        if (playbackTimerId !== null) {
            window.clearTimeout(playbackTimerId);
            playbackTimerId = null;
        }
    }

    function cancelPlaybackSequence() {
        playbackSequenceId += 1;
        clearPlaybackTimer();
        progressTracker?.stop();
    }

    function failPlaybackSequence(error) {
        cancelPlaybackSequence();
        playbackStore?.setError(error);
        onError(error);
    }

    function startSequentialPlayback(result) {
        cancelPlaybackSequence();

        const sequenceId = playbackSequenceId;
        const variants = result.orderedVariants;
        const variantDurationSeconds =
            result.timing.totalDurationSeconds;
        const transportLeadInMs = 50;

        function beginVariant(variantIndex) {
            if (sequenceId !== playbackSequenceId) {
                return;
            }

            const variant = variants[variantIndex];

            if (!variant) {
                failPlaybackSequence(new Error(
                    `Siradaki song variant bulunamadi: ${variantIndex}`
                ));
                return;
            }

            const songVariantId = variant.id ?? variant.variantNo;

            try {
                playbackStore?.setSongVariantPlaying(songVariantId);
                result.playVariant(variantIndex);
            } catch (error) {
                failPlaybackSequence(error);
                return;
            }

            playbackTimerId = window.setTimeout(() => {
                playbackTimerId = null;

                try {
                    progressTracker?.start(
                        variantDurationSeconds,
                        {
                            onComplete: () => {
                                if (sequenceId !== playbackSequenceId) {
                                    return;
                                }

                                const nextVariantIndex = variantIndex + 1;

                                if (nextVariantIndex < variants.length) {
                                    beginVariant(nextVariantIndex);
                                    return;
                                }

                                playbackStore?.completePlayback();
                                socket.sendPlaybackComplete({
                                    requestId: createRequestId()
                                });
                            }
                        }
                    );
                } catch (error) {
                    failPlaybackSequence(error);
                }
            }, transportLeadInMs);
        }

        playbackTimerId = window.setTimeout(() => {
            playbackTimerId = null;
            beginVariant(0);
        }, result.startAt * 1000);
    }

    const playbackMessageHandler = createPlaybackMessageHandler({
        playbackController,
        getVariants,
        getInstrumentsById,
        loadPlayback,
        onPlaybackStart: ({ payload, variants, result }) => {
            playbackStore?.setVariants(variants);
            playbackStore?.setPlaybackStart({
                ...payload,
                variantOrder: result.orderedVariants.map(
                    variant => variant.id ?? variant.variantNo
                )
            });
            startSequentialPlayback(result);
            onPlaybackStart({ payload, variants, result });
        }
    });

    const votingMessageHandler = createVotingMessageHandler({
        votingStore,
        onVoteAck
    });
    const gameStateMessageHandler = createGameStateMessageHandler({
        votingStore,
        onGameState
    });

    const socket = createGameSocket({
        url,
        onOpen,
        onClose: (event) => {
            cancelPlaybackSequence();
            onClose(event);
        },
        onError,
        onMessage: async (message) => {
            try {
                if (message?.type === "error") {
                    const payload = message.payload || {};
                    throw new Error(
                        `${payload.code || "GAME_ERROR"}: ${payload.message || "Oyun isteği reddedildi."}`
                    );
                }

                const result = await playbackMessageHandler.handleMessage(message);

                if (result.handled) {
                    return;
                }

                const votingResult = votingMessageHandler.handleMessage(message);

                if (!votingResult.handled) {
                    const gameStateResult = gameStateMessageHandler.handleMessage(message);

                    if (!gameStateResult.handled) {
                        onMessage(message);
                    }
                }
            } catch (error) {
                onError(error);
            }
        }
    });

    function connect() {
        return socket.connect();
    }

    function sendPlaybackReady({ requestId }) {
        socket.sendPlaybackReady({ requestId });
    }

    function sendPlaybackComplete({ requestId }) {
        socket.sendPlaybackComplete({ requestId });
    }

    function sendVote({ requestId, songVariantId }) {
        socket.sendVote({
            requestId,
            songVariantId
        });
    }

    function sendPlayerReady({ requestId }) {
        socket.sendPlayerReady({ requestId });
    }

    function sendMatchContinue({ requestId }) {
        socket.sendMatchContinue({ requestId });
    }

    function sendDraftUpdate({ requestId, patternData }) {
        socket.sendDraftUpdate({
            requestId,
            patternData
        });
    }

    function sendPatternLock({ requestId }) {
        socket.sendPatternLock({ requestId });
    }

    function close() {
        cancelPlaybackSequence();
        socket.close();
    }

    return {
        connect,
        sendPlaybackReady,
        sendPlaybackComplete,
        sendVote,
        sendPlayerReady,
        sendMatchContinue,
        sendDraftUpdate,
        sendPatternLock,
        close,
        isOpen: socket.isOpen
    };
}

export {
    createGameSessionClient
};

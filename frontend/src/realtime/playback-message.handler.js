function createPlaybackMessageHandler({
    playbackController,
    getVariants,
    getInstrumentsById,
    loadPlayback = null,
    onPlaybackStart = () => {}
}) {
    if (!playbackController) {
        throw new Error("Playback controller is required.");
    }

    async function handleMessage(message) {
        if (message?.type !== "playback:start") {
            return {
                handled: false
            };
        }

        try {
            if (loadPlayback && message.payload?.matchId !== undefined) {
                await loadPlayback(message.payload.matchId);
            }
        } catch (error) {
            throw new Error(
                `Playback verisi yüklenemedi: ${error.message}`
            );
        }

        const variants = getVariants();
        const instrumentsById = getInstrumentsById();

        if (!Array.isArray(variants) || variants.length === 0) {
            throw new Error("Playback varyantları boş geldi.");
        }

        let playbackResult;

        try {
            const result = playbackController.handlePlaybackStart({
                payload: message.payload,
                variants,
                instrumentsById
            });

            playbackResult = result;

            onPlaybackStart({
                payload: message.payload,
                variants,
                result
            });
        } catch (error) {
            throw new Error(
                `Playback ses planlama hatası: ${error.message}`
            );
        }

        return {
            handled: true,
            result: playbackResult
        };
    }

    return {
        handleMessage
    };
}

export {
    createPlaybackMessageHandler
};

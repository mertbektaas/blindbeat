import { fetchMatchPlayback } from "../api/playback.api.js";
import { createPlaybackController } from "./playback-controller.js";
import { createGameSessionClient } from "../realtime/game-session.client.js";

function createPlaybackFlow({
    apiUrl,
    wsUrl,
    playbackStore,
    votingStore,
    audioEngine,
    playbackScheduler,
    progressTracker,
    onMessage,
    onGameState,
    onOpen,
    onClose,
    onError,
    createRequestId = () => crypto.randomUUID()
}) {
    const playbackController = createPlaybackController({
        playbackScheduler
    });

    const sessionClient = createGameSessionClient({
        url: wsUrl,
        playbackController,
        playbackStore,
        votingStore,
        progressTracker,
        createRequestId,
        getVariants: () => playbackStore.variants,
        getInstrumentsById: () => getInstrumentsById(playbackStore.variants),
        loadPlayback: loadMatchPlayback,
        onMessage,
        onGameState,
        onOpen,
        onClose,
        onError
    });

    async function loadMatchPlayback(matchId) {
        const playbackData = await fetchMatchPlayback({
            apiUrl,
            matchId
        });

        playbackStore.setPlaybackData(playbackData);

        return playbackData;
    }

    async function prepareAudio() {
        await audioEngine.initialize();
        await audioEngine.preload();
        playbackStore.markAudioReady();
    }

    function connect() {
        return sessionClient.connect();
    }

    function sendPlaybackReady() {
        if (!playbackStore.audioReady) {
            throw new Error("Audio must be ready before playback readiness.");
        }

        sessionClient.sendPlaybackReady({
            requestId: createRequestId()
        });
    }

    function sendPlaybackComplete() {
        sessionClient.sendPlaybackComplete({
            requestId: createRequestId()
        });
    }

    function sendVote(songVariantId) {
        sessionClient.sendVote({
            requestId: createRequestId(),
            songVariantId
        });
    }

    function sendPlayerReady() {
        sessionClient.sendPlayerReady({
            requestId: createRequestId()
        });
    }

    function sendMatchContinue() {
        sessionClient.sendMatchContinue({
            requestId: createRequestId()
        });
    }

    function sendDraftUpdate(patternData) {
        sessionClient.sendDraftUpdate({
            requestId: createRequestId(),
            patternData
        });
    }

    function sendPatternLock() {
        sessionClient.sendPatternLock({
            requestId: createRequestId()
        });
    }

    function stop() {
        progressTracker?.reset();
        playbackController.stop();
        audioEngine.stop();
        playbackStore.reset();
        sessionClient.close();
    }

    return {
        loadMatchPlayback,
        prepareAudio,
        connect,
        sendPlaybackReady,
        sendPlaybackComplete,
        sendVote,
        sendPlayerReady,
        sendMatchContinue,
        sendDraftUpdate,
        sendPatternLock,
        stop
    };
}

function getInstrumentsById(variants) {
    const instrumentsById = {};
    const drumCodes = new Set(["kick", "snare", "hi-hat"]);

    for (const variant of variants) {
        for (const pattern of variant.patterns || []) {
            if (pattern.instrumentId && pattern.instrumentCode) {
                instrumentsById[pattern.instrumentId] = drumCodes.has(
                    pattern.instrumentCode
                )
                    ? "drums"
                    : pattern.instrumentCode;
            }
        }
    }

    return instrumentsById;
}

export {
    createPlaybackFlow,
    getInstrumentsById
};

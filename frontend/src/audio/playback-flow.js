import { fetchMatchPlayback } from "../api/playback.api.js";
import { createPlaybackController } from "./playback-controller.js";
import { createGameSessionClient } from "../realtime/game-session.client.js";
import { calculatePlaybackTiming } from "./timing.js";

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

    // Voting phase'inde kullanıcı kendi tarayıcısında tek bir
    // şarkıyı tekrar dinlemek istediğinde. Backend'e haber vermez,
    // sadece local transport'u planlar. Mevcut playback ile
    // çakışmasın diye transport zaten durmuşsa (oyun oynanırken)
    // veya başka bir replay çalıyorsa erken çıkar.
    function replayVariant(songVariantId) {
        if (!playbackStore.audioReady) {
            throw new Error("Audio is not ready for replay.");
        }

        const variants = playbackStore.variants || [];
        const variant = variants.find((entry) => (
            (entry.id ?? entry.variantNo) === songVariantId
        ));

        if (!variant) {
            throw new Error(
                `Replay icin variant bulunamadi: ${songVariantId}`
            );
        }

        const timing = calculatePlaybackTiming({
            bpm: playbackStore.bpm,
            stepCount: playbackStore.stepCount,
            playbackLoops: playbackStore.playbackLoops
        });

        const instrumentsById = getInstrumentsById(variants);

        // Replay loop sayisini 1 loop ile sinirla ki uzun surmesin.
        // Kullanici sadece "tekrar dinlemek" istiyor, tum oyun
        // boyu kadar dinlemek degil.
        const replayTiming = {
            ...timing,
            playbackLoops: 1,
            totalDurationSeconds: timing.loopDurationSeconds
        };

        playbackStore.setSongVariantPlaying(
            (variant.id ?? variant.variantNo)
        );

        try {
            playbackController.replaySingleVariant({
                variant,
                instrumentsById,
                timing: replayTiming
            });
        } catch (error) {
            playbackStore.setSongVariantPlaying(null);
            throw error;
        }

        // Replay loop tamamlaninca transport'u durdur ve
        // songVariantPlaying bayragini temizle ki voting butonlari
        // normal davranmaya devam etsin.
        const totalReplayMs = replayTiming.totalDurationSeconds * 1000;
        window.setTimeout(() => {
            audioEngine.stop();
            playbackStore.setSongVariantPlaying(null);
        }, totalReplayMs + 200);
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
        replayVariant,
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

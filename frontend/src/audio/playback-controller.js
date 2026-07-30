import {
    calculatePlaybackStartDelay,
    calculatePlaybackTiming
} from "./timing.js";

function createPlaybackController({ playbackScheduler }) {
    if (!playbackScheduler) {
        throw new Error("Playback scheduler is required.");
    }

    function handlePlaybackStart({
        payload,
        variants,
        instrumentsById
    }) {
        const timing = calculatePlaybackTiming({
            bpm: payload.bpm,
            stepCount: payload.stepCount,
            playbackLoops: payload.playbackLoops
        });

        const startAt = calculatePlaybackStartDelay({
            startAt: payload.startAt,
            serverTime: payload.serverTime
        });

        const variantsById = new Map(
            variants.map((variant) => [variant.id, variant])
        );

        const orderedVariants = (payload.variantOrder || [])
            .map((variantId) => (
                variantsById.get(variantId)
                || variants.find(
                    variant => variant.variantNo === variantId
                )
            ))
            .filter(Boolean);

        const sequence = orderedVariants.length > 0
            ? orderedVariants
            : variants;

        function playVariant(variantIndex) {
            const variant = sequence[variantIndex];

            if (!variant) {
                throw new Error(
                    `Playback varyanti bulunamadi: ${variantIndex}`
                );
            }

            playbackScheduler.stop();

            const scheduledVariant = playbackScheduler.scheduleVariant({
                variant,
                instrumentsById,
                startAt: 0,
                timing,
                playbackLoops: timing.playbackLoops
            });

            playbackScheduler.start();

            return scheduledVariant;
        }

        return {
            startAt,
            timing,
            orderedVariants: sequence,
            playVariant
        };
    }

    function stop() {
        playbackScheduler.stop();
    }

    return {
        handlePlaybackStart,
        stop
    };
}

export {
    createPlaybackController
};

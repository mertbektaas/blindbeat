function createPlaybackPhaseManager({
    phaseStateMachine,
    playbackReadiness,
    playbackCompletion,
    randomFn = Math.random
}) {
    function createRandomVariantOrder(variants) {
        // Frontend oy verirken veritabanindaki SongVariant.id degerini gonderir.
        // variantNo sadece kullaniciya gorunen sarki sira numarasidir.
        const order = variants.map((variant) => variant.id ?? variant.variantNo);

        for (let index = order.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(randomFn() * (index + 1));

            [order[index], order[randomIndex]] = [
                order[randomIndex],
                order[index]
            ];
        }

        return order;
    }

    function enterPlayback({ runtime, variants }) {
        if (
            runtime.phase !== "MATCH_BUILDING" &&
            runtime.phase !== "OG_ROUND"
        ) {
            throw new Error(
                `Playback fazına geçilemez: ${runtime.phase}`
            );
        }

        phaseStateMachine.transition(runtime, "PLAYBACK");

        runtime.variantOrder = createRandomVariantOrder(variants);

        runtime.playbackStartAt = null;
        playbackReadiness.reset(runtime);
        playbackCompletion.reset(runtime);

        return runtime;
    }

    return {
        enterPlayback
    };
}

module.exports = {
    createPlaybackPhaseManager
};

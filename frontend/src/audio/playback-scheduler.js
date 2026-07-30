function createPlaybackScheduler({ audioEngine }) {
    if (!audioEngine) {
        throw new Error("Audio engine is required.");
    }

    function resolvePattern(patternEntry) {
        if (patternEntry.pattern?.patternData) {
            return patternEntry.pattern.patternData;
        }

        if (patternEntry.pattern) {
            return patternEntry.pattern;
        }

        if (patternEntry.patternData) {
            return {
                data: patternEntry.patternData
            };
        }

        throw new Error(`Pattern data is missing: ${patternEntry.patternId}`);
    }

    function resolveInstrument(patternEntry, instrumentsById) {
        const instrument = instrumentsById[patternEntry.instrumentId];

        if (instrument) {
            return instrument;
        }

        if (patternEntry.instrument?.code) {
            return patternEntry.instrument.code;
        }

        if (patternEntry.instrumentCode) {
            return patternEntry.instrumentCode;
        }

        throw new Error(`Instrument is missing: ${patternEntry.instrumentId}`);
    }

    function scheduleVariant({
        variant,
        instrumentsById,
        startAt,
        timing,
        playbackLoops
    }) {
        const eventIds = [];
        const patternEntries = variant?.patterns || [];

        for (let loopIndex = 0; loopIndex < playbackLoops; loopIndex++) {
            const loopStartAt = startAt + (
                loopIndex * timing.loopDurationSeconds
            );

            for (const patternEntry of patternEntries) {
                try {
                    const pattern = resolvePattern(patternEntry);
                    const instrument = resolveInstrument(patternEntry, instrumentsById);

                    const eventId = audioEngine.schedulePattern({
                        pattern,
                        instrument,
                        startAt: loopStartAt,
                        timing
                    });

                    eventIds.push(eventId);
                } catch (error) {
                    throw new Error(
                        `Varyant ${variant.variantNo}, loop ${loopIndex + 1}, pattern ${patternEntry.patternId} planlanamadı: ${error.message}`
                    );
                }
            }
        }

        return {
            variantNo: variant.variantNo,
            startAt,
            eventIds
        };
    }

    function scheduleVariants({
        variants,
        instrumentsById,
        startAt = 0,
        timing,
        variantOrder = []
    }) {
        if (!timing) {
            throw new Error("Playback timing is required.");
        }

        const variantsById = new Map(
            variants.map((variant) => [variant.id, variant])
        );

        const orderedVariants = variantOrder.length > 0
            ? variantOrder
                .map((variantId) => (
                    variantsById.get(variantId)
                    || variants.find((variant) => variant.variantNo === variantId)
                ))
                .filter(Boolean)
            : variants;

        return orderedVariants.map((variant, variantIndex) => {
            const variantStartAt = startAt + (
                variantIndex * timing.totalDurationSeconds
            );

            return scheduleVariant({
                variant,
                instrumentsById,
                startAt: variantStartAt,
                timing,
                playbackLoops: timing.playbackLoops
            });
        });
    }

    function start() {
        audioEngine.start();
    }

    function stop() {
        audioEngine.stop();
    }

    return {
        scheduleVariant,
        scheduleVariants,
        start,
        stop
    };
}

export {
    createPlaybackScheduler
};

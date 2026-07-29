function createSongVariantBuilder() {
    function buildSongVariants({
        selectedPatterns,
        instrumentIds,
        variantCount,
        randomFn = Math.random
    }) {
        const patternsByInstrument = {};
        const variants = Array.from(
            { length: variantCount },
            (_, index) => ({
                variantNo: index + 1,
                patterns: []
            })
        );

        for (const instrumentId of instrumentIds) {
            patternsByInstrument[instrumentId] = [];
        }

        for (const pattern of selectedPatterns) {
            patternsByInstrument[pattern.instrumentId].push(pattern);
        }

        for (const instrumentId of instrumentIds) {
            const instrumentPatterns = patternsByInstrument[instrumentId];

            if (instrumentPatterns.length !== variantCount) {
                return {
                    success: false,
                    error: {
                        code: "INVALID_SELECTED_PATTERN_COUNT",
                        message: "Her instrument icin variant sayisi kadar pattern gerekir."
                    }
                };
            }

            const shuffledPatterns = [...instrumentPatterns];

            for (let index = shuffledPatterns.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(randomFn() * (index + 1));

                [shuffledPatterns[index], shuffledPatterns[randomIndex]] = [
                    shuffledPatterns[randomIndex],
                    shuffledPatterns[index]
                ];
            }

            const slotOrder = instrumentIds.indexOf(instrumentId) + 1;

            shuffledPatterns.forEach((pattern, variantIndex) => {
                variants[variantIndex].patterns.push({
                    patternId: pattern.id,
                    instrumentId: pattern.instrumentId,
                    playerId: pattern.playerId,
                    slotOrder
                });
            });
        }

        return {
            success: true,
            variants
        };
    }

    function buildOgSongVariants({ candidates, instrumentIds }) {
        const variants = candidates.map((candidate, index) => {
            const patternsByInstrument = new Map(
                candidate.patterns.map((pattern) => [
                    pattern.instrumentId,
                    pattern
                ])
            );

            const patterns = instrumentIds.map((instrumentId) => {
                const pattern = patternsByInstrument.get(instrumentId);

                if (!pattern) {
                    return null;
                }

                return {
                    patternId: pattern.id,
                    instrumentId,
                    playerId: candidate.playerId,
                    slotOrder: instrumentIds.indexOf(instrumentId) + 1
                };
            });

            return {
                variantNo: index + 1,
                playerId: candidate.playerId,
                patterns
            };
        });

        const invalidVariant = variants.find((variant) =>
            variant.patterns.some((pattern) => pattern === null)
        );

        if (invalidVariant) {
            return {
                success: false,
                error: {
                    code: "INVALID_OG_CANDIDATE",
                    message: "OG adayinin her enstruman icin archive patterni olmali."
                }
            };
        }

        return {
            success: true,
            variants
        };
    }

    return {
        buildSongVariants,
        buildOgSongVariants
    };
}

module.exports = {
    createSongVariantBuilder
};

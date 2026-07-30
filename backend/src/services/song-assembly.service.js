const {
    createPatternRepository
} = require("../repositories/pattern.repository");
const {
    createSongVariantRepository
} = require("../repositories/song-variant.repository");
const {
    createPatternPoolService
} = require("./pattern-pool.service");
const {
    createPatternPoolSelector
} = require("../game/pattern-pool.selection");
const {
    createSongVariantBuilder
} = require("../game/song-variant.builder");
const { PatternPoolStatus } = require("@prisma/client");
const gameConfig = require("../config/game.config");

function createSongAssemblyService({ prisma }) {
    const patternPoolSelector = createPatternPoolSelector();
    const songVariantBuilder = createSongVariantBuilder();

    async function buildMatchSongVariants({
        sessionId,
        matchId,
        instrumentIds,
        playerIds,
        variantCount,
        currentMatchId
    }) {
        return prisma.$transaction(async (tx) => {
            const patternRepository = createPatternRepository(tx);
            const songVariantRepository = createSongVariantRepository(tx);
            const patternPoolService = createPatternPoolService({
                patternRepository
            });

            await patternPoolService.archiveOverflowPatterns({
                sessionId,
                instrumentIds,
                maxActivePatternCount: gameConfig.maxActivePatternCount
            });

            const snapshot = await patternPoolService.getPoolSnapshot({sessionId, instrumentIds});

            const selection = patternPoolSelector.selectPatternsForVariants({patternsByInstrument: snapshot.patternsByInstrument, instrumentIds, playerIds, variantCount, currentMatchId,randomFn: Math.random});

            if(!selection.success) {
                return {
                    success: false,
                    error: selection.error || {
                        code: "PATTERN_SELECTION_FAILED",
                        message: "Şarkı varyantları için pattern seçilemedi."
                    }
                };
            }

            const build = songVariantBuilder.buildSongVariants({selectedPatterns: selection.selectedPatterns, instrumentIds,variantCount});

            if(!build.success) {
                return {
                    success: false,
                    error: build.error || {
                        code: "SONG_VARIANT_BUILD_FAILED",
                        message: "Şarkı varyantları oluşturulamadı."
                    }
                };
            }

            for(const variant of build.variants){
                const savedVariant = await songVariantRepository.createSongVariant({matchId, variantNo: variant.variantNo});
                await songVariantRepository.createSongVariantPatterns({
                    songVariantId: savedVariant.id,
                    patterns: variant.patterns
                })
            }

            const selectedPatternIds = selection.selectedPatterns.map(pattern => pattern.id);

            
            await patternRepository.updatePoolStatusMany({patternIds: selectedPatternIds, poolStatus: PatternPoolStatus.CONSUMED});

            const storedVariants = await songVariantRepository.findByMatchId({
                matchId
            });

            return {
                success: true,
                matchId,
                variants: storedVariants
            }
        });
    }

    async function buildOgRoundSongVariants({
        matchId,
        candidates,
        instrumentIds
    }) {
        const build = songVariantBuilder.buildOgSongVariants({
            candidates,
            instrumentIds
        });

        if (!build.success) {
            return build;
        }

        return prisma.$transaction(async (tx) => {
            const songVariantRepository = createSongVariantRepository(tx);

            for (const variant of build.variants) {
                const savedVariant = await songVariantRepository.createSongVariant({
                    matchId,
                    variantNo: variant.variantNo
                });

                await songVariantRepository.createSongVariantPatterns({
                    songVariantId: savedVariant.id,
                    patterns: variant.patterns
                });
            }

            const variants = await songVariantRepository.findByMatchId({
                matchId
            });

            return {
                success: true,
                matchId,
                variants
            };
        });
    }

    return {
        buildMatchSongVariants,
        buildOgRoundSongVariants
    };
}

module.exports = {
    createSongAssemblyService
};

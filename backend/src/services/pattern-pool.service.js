const { PatternPoolStatus } = require("@prisma/client");

function createPatternPoolService({ patternRepository }) {
    async function getPoolSnapshot({ sessionId, instrumentIds }) {
        const patterns = await patternRepository.getAllActivePatterns(
            sessionId,
            instrumentIds,
        );

        const patternsByInstrument = {};

        for (const instrumentId of instrumentIds) {
            patternsByInstrument[instrumentId] = [];
        }

        for (const pattern of patterns) {
            patternsByInstrument[pattern.instrumentId].push(pattern);
        }

        return {
            sessionId,
            patternsByInstrument
        };
    }

    async function archiveOverflowPatterns({
        sessionId,
        instrumentIds,
        maxActivePatternCount
    }){
        const archivedPatternIds = [];

        for (const instrumentId of instrumentIds){
            const patterns = await patternRepository.getAllActivePatterns(sessionId, [instrumentId]);
            if (patterns.length <= maxActivePatternCount) continue;

            const overflow = patterns.length - maxActivePatternCount;
            const oldPatterns = patterns.slice(0, overflow);
            const patternIds = oldPatterns.map(({ id }) => id);

            await patternRepository.updatePoolStatusMany({
                patternIds,
                poolStatus: PatternPoolStatus.ARCHIVE
            });

            archivedPatternIds.push(...patternIds);
        }

        return {
            archivedPatternIds,
            archivedCount: archivedPatternIds.length
        };
    }

    return {
        getPoolSnapshot,
        archiveOverflowPatterns
    };
}

module.exports = {
    createPatternPoolService
};

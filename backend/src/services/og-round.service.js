const {
    getTiedLeaderIds,
    createOgRoundSelector
} = require("../game/og-round");

function createOgRoundService({
    patternRepository,
    sessionLeaderboardRepository,
    selector = createOgRoundSelector()
}) {
    async function prepareRound({
        sessionId,
        playerIds,
        instrumentIds,
        excludedPatternIds = []
    }) {
        const leaderboard = await sessionLeaderboardRepository.findBySessionId(
            sessionId
        );
        const tiedPlayerIds = getTiedLeaderIds(leaderboard);

        if (tiedPlayerIds.length < 2) {
            return {
                started: false,
                reason: "NO_FINAL_TIE",
                tiedPlayerIds
            };
        }

        const eligiblePlayerIds = playerIds
            ? tiedPlayerIds.filter((playerId) => playerIds.includes(playerId))
            : tiedPlayerIds;

        const archivedPatterns = await patternRepository.findArchivedBySessionAndPlayers({
            sessionId,
            playerIds: eligiblePlayerIds,
            instrumentIds,
            excludedPatternIds
        });

        const selection = selector.selectCandidates({
            archivedPatterns,
            tiedPlayerIds: eligiblePlayerIds,
            instrumentIds,
            excludedPatternIds
        });

        if (selection.candidates.length !== eligiblePlayerIds.length) {
            return {
                started: false,
                reason: "ARCHIVE_PATTERN_INSUFFICIENT",
                tiedPlayerIds: eligiblePlayerIds,
                ...selection
            };
        }

        return {
            started: true,
            tiedPlayerIds: eligiblePlayerIds,
            ...selection,
            patternIds: selection.candidates.flatMap((candidate) =>
                candidate.patterns.map(({ id }) => id)
            )
        };
    }

    return {
        prepareRound
    };
}

module.exports = {
    createOgRoundService
};

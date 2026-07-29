function calculateMatchScores({
    variants,
    votes,
    unanimousVoteMultiplier = 2
}) {
    const voteCounts = new Map();

    for (const variant of variants) {
        voteCounts.set(variant.id, 0);
    }

    for (const vote of votes) {
        if (voteCounts.has(vote.songVariantId)) {
            voteCounts.set(
                vote.songVariantId,
                voteCounts.get(vote.songVariantId) + 1
            );
        }
    }

    const highestVoteCount = Math.max(
        0,
        ...voteCounts.values()
    );

    const winnerVariantIds = variants
        .filter((variant) => voteCounts.get(variant.id) === highestVoteCount)
        .map((variant) => variant.id);

    if (highestVoteCount === 0) {
        return {
            voteCounts: Object.fromEntries(voteCounts),
            winnerVariantIds: [],
            pointsByPlayer: {},
            tie: false,
            unanimous: false
        };
    }

    const pointsByPlayer = {};
    const unanimous = highestVoteCount === votes.length;
    const tie = winnerVariantIds.length > 1;

    for (const variant of variants) {
        if (!winnerVariantIds.includes(variant.id)) {
            continue;
        }

        if (tie) {
            for (const pattern of variant.patterns) {
                const playerId = pattern.playerId ?? pattern.pattern?.playerId;

                pointsByPlayer[playerId] =
                    (pointsByPlayer[playerId] || 0) + 1;
            }
            continue;
        }

        const uniquePlayerIds = new Set(
            variant.patterns.map(
                (pattern) => pattern.playerId ?? pattern.pattern?.playerId
            )
        );
        const points = unanimous ? unanimousVoteMultiplier : 1;

        for (const playerId of uniquePlayerIds) {
            pointsByPlayer[playerId] =
                (pointsByPlayer[playerId] || 0) + points;
        }
    }

    return {
        voteCounts: Object.fromEntries(voteCounts),
        winnerVariantIds,
        pointsByPlayer,
        tie,
        unanimous
    };
}

module.exports = {
    calculateMatchScores
};

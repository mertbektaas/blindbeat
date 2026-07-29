function getTiedLeaderIds(leaderboard) {
    if (!leaderboard || leaderboard.length === 0) {
        return [];
    }

    const highestScore = leaderboard[0].totalScore;

    return leaderboard
        .filter((entry) => entry.totalScore === highestScore)
        .map((entry) => entry.playerId ?? entry.player?.id)
        .filter((playerId) => playerId !== undefined);
}

function createOgRoundSelector({ randomFn = Math.random } = {}) {
    function choosePattern(patterns) {
        if (patterns.length === 0) {
            return undefined;
        }

        const index = Math.min(
            patterns.length - 1,
            Math.floor(randomFn() * patterns.length)
        );

        return patterns[index];
    }

    function selectCandidates({
        archivedPatterns,
        tiedPlayerIds,
        instrumentIds,
        excludedPatternIds = []
    }) {
        const excludedIds = new Set(excludedPatternIds);
        const patternsByPlayerAndInstrument = new Map();

        for (const pattern of archivedPatterns) {
            if (excludedIds.has(pattern.id)) {
                continue;
            }

            const playerKey = pattern.playerId;
            const instrumentKey = pattern.instrumentId;

            if (!patternsByPlayerAndInstrument.has(playerKey)) {
                patternsByPlayerAndInstrument.set(playerKey, new Map());
            }

            const patternsByInstrument = patternsByPlayerAndInstrument.get(
                playerKey
            );

            if (!patternsByInstrument.has(instrumentKey)) {
                patternsByInstrument.set(instrumentKey, []);
            }

            patternsByInstrument.get(instrumentKey).push(pattern);
        }

        const candidates = [];
        const missingInstrumentsByPlayer = {};

        for (const playerId of tiedPlayerIds) {
            const patternsByInstrument = patternsByPlayerAndInstrument.get(
                playerId
            );
            const selectedPatterns = [];
            const missingInstrumentIds = [];

            for (const instrumentId of instrumentIds) {
                const availablePatterns = patternsByInstrument?.get(instrumentId) || [];
                const selectedPattern = choosePattern(availablePatterns);

                if (!selectedPattern) {
                    missingInstrumentIds.push(instrumentId);
                    continue;
                }

                selectedPatterns.push(selectedPattern);
            }

            if (missingInstrumentIds.length > 0) {
                missingInstrumentsByPlayer[playerId] = missingInstrumentIds;
                continue;
            }

            candidates.push({
                playerId,
                patterns: selectedPatterns
            });
        }

        return {
            candidates,
            missingInstrumentsByPlayer
        };
    }

    return {
        selectCandidates
    };
}

module.exports = {
    getTiedLeaderIds,
    createOgRoundSelector
};

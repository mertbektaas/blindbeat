function findFairnessCandidate({
    patternsByInstrument,
    instrumentIds,
    playerId,
    selectedPatternIds,
    selectedCountByInstrument,
    variantCount
}) {
    let candidate = null;

    for (const instrumentId of instrumentIds) {
        const selectedCount = selectedCountByInstrument[instrumentId] ?? 0;

        if (selectedCount >= variantCount) continue;

        const patterns = patternsByInstrument[instrumentId] ?? [];
        const pattern = patterns.find((item) => {
            return item.playerId === playerId
                && !selectedPatternIds.has(item.id);
        });

        if (!pattern) continue;

        if (!candidate || selectedCount < candidate.selectedCount) {
            candidate = {
                instrumentId,
                pattern,
                selectedCount
            };
        }
    }

    return candidate;
}

function selectWeightedPattern({
    candidates,
    currentMatchId,
    randomFn = Math.random
}) {
    if (candidates.length === 0) return null;

    const weightedCandidates = candidates.map((pattern) => ({
        pattern,
        weight: pattern.matchId === currentMatchId ? 1.2 : 1.0
    }));

    const totalWeight = weightedCandidates.reduce(
        (total, candidate) => total + candidate.weight,
        0
    );

    let target = randomFn() * totalWeight;

    for (const candidate of weightedCandidates) {
        if (target < candidate.weight) {
            return candidate.pattern;
        }

        target -= candidate.weight;
    }

    return weightedCandidates[weightedCandidates.length - 1].pattern;
}

function createPatternPoolSelector() {
    function selectPatternsForVariants({
        patternsByInstrument,
        instrumentIds,
        playerIds,
        variantCount,
        currentMatchId,
        randomFn = Math.random
    }) {
        if (variantCount * instrumentIds.length < playerIds.length) {
            return {
                success: false,
                error: {
                    code: "NOT_ENOUGH_PATTERN_SLOTS",
                    message: "Fairness icin yeterli song slotu yok."
                }
            };
        }

        for (const instrumentId of instrumentIds) {
            const patterns = patternsByInstrument[instrumentId] ?? [];

            if (patterns.length < variantCount) {
                return {
                    success: false,
                    error: {
                        code: "INSUFFICIENT_PATTERN_POOL",
                        message: "Ilgili instrument icin yeterli pattern yok."
                    }
                };
            }
        }

        const selectedPatterns = [];
        const selectedPatternIds = new Set();
        const representedPlayers = new Set();
        const selectedCountByInstrument = {};

        for (const playerId of playerIds) {
            const candidate = findFairnessCandidate({
                patternsByInstrument,
                instrumentIds,
                playerId,
                selectedPatternIds,
                selectedCountByInstrument,
                variantCount
            });

            if (!candidate) {
                return {
                    success: false,
                    error: {
                        code: "FAIRNESS_NOT_POSSIBLE",
                        message: "Tum oyunculari pattern seciminde temsil etmek mumkun degil."
                    }
                };
            }

            selectedPatterns.push(candidate.pattern);
            selectedPatternIds.add(candidate.pattern.id);
            representedPlayers.add(playerId);
            selectedCountByInstrument[candidate.instrumentId] =
                (selectedCountByInstrument[candidate.instrumentId] ?? 0) + 1;
        }

        for (const instrumentId of instrumentIds) {
            while ((selectedCountByInstrument[instrumentId] ?? 0) < variantCount) {
                const patterns = patternsByInstrument[instrumentId] ?? [];
                const candidates = patterns.filter((pattern) => {
                    return !selectedPatternIds.has(pattern.id);
                });

                const selectedPattern = selectWeightedPattern({
                    candidates,
                    currentMatchId,
                    randomFn
                });

                if (!selectedPattern) {
                    return {
                        success: false,
                        error: {
                            code: "INSUFFICIENT_PATTERN_POOL",
                            message: "Ilgili instrument icin secilecek pattern kalmadi."
                        }
                    };
                }

                selectedPatterns.push(selectedPattern);
                selectedPatternIds.add(selectedPattern.id);
                selectedCountByInstrument[instrumentId] =
                    (selectedCountByInstrument[instrumentId] ?? 0) + 1;
            }
        }

        return {
            success: true,
            selectedPatterns,
            representedPlayers: [...representedPlayers],
            selectedCountByInstrument
        };
    }

    return {
        selectPatternsForVariants
    };
}

module.exports = {
    createPatternPoolSelector,
    selectWeightedPattern
};

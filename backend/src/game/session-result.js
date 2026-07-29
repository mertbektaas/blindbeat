function createSessionResult({ leaderboard }) {
    function createMedal(entry, medal) {
        return {
            playerId: entry.playerId,
            ...(entry.player?.nickname
                ? { nickname: entry.player.nickname }
                : {}),
            medal,
            totalScore: entry.totalScore
        };
    }

    const orderedLeaderboard = [...leaderboard].sort(
        (left, right) => right.totalScore - left.totalScore
    );

    if (orderedLeaderboard.length === 0) {
        return {
            phase: "SESSION_RESULT",
            medals: [],
            tied: false
        };
    }

    const highestScore = orderedLeaderboard[0].totalScore;
    const topPlayers = orderedLeaderboard.filter(
        (entry) => entry.totalScore === highestScore
    );

    if (topPlayers.length > 1) {
        return {
            phase: "SESSION_RESULT",
            medals: topPlayers.map((entry) => createMedal(entry, "GOLD")),
            tied: true
        };
    }

    return {
        phase: "SESSION_RESULT",
        medals: orderedLeaderboard
            .slice(0, 3)
            .map((entry, index) => createMedal(
                entry,
                ["GOLD", "SILVER", "BRONZE"][index]
            )),
        tied: false
    };
}

module.exports = {
    createSessionResult
};

const { success } = require("../response");

function createLeaderboardController({
    leaderboardService,
    readPlayerSessionToken,
    identityRegistry
}) {
    return {
        async getMatchLeaderboard(req, res, next) {
            try {
                const token = readPlayerSessionToken(
                    req.headers.cookie
                );
                const identity = identityRegistry.get(token);
                const matchId = Number(req.params.matchId);

                const leaderboard = await leaderboardService.getMatchLeaderboard({
                    matchId,
                    playerId: identity?.playerId
                });

                res
                    .status(200)
                    .json(success(leaderboard, req.requestId));
            } catch (error) {
                next(error);
            }
        }
    };
}

module.exports = {
    createLeaderboardController
};

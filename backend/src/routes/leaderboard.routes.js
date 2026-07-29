const express = require("express");

function createLeaderboardRoutes({ leaderboardController }) {
    const router = express.Router();

    router.get(
        "/:matchId/leaderboard",
        leaderboardController.getMatchLeaderboard
    );

    return router;
}

module.exports = {
    createLeaderboardRoutes
};

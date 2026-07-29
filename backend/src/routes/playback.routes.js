const express = require("express");

function createPlaybackRoutes({ playbackController }) {
    const router = express.Router();

    router.get(
        "/:matchId/playback",
        playbackController.getMatchPlayback
    );

    return router;
}

module.exports = {
    createPlaybackRoutes
};

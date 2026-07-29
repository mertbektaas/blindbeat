const { success } = require("../response");

function createPlaybackController({
    playbackService,
    readPlayerSessionToken,
    identityRegistry
}) {
    return {
        async getMatchPlayback(req, res, next) {
            try {
                const token = readPlayerSessionToken(
                    req.headers.cookie
                );
                const identity = identityRegistry.get(token);
                const matchId = Number(req.params.matchId);

                const result = await playbackService.getMatchPlayback({
                    matchId,
                    identity
                });

                res
                    .status(200)
                    .json(success(result, req.requestId));
            } catch (error) {
                next(error);
            }
        }
    };
}

module.exports = {
    createPlaybackController
};

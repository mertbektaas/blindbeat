const {
    matchNotFound,
    playerNotInSession,
    votingNotOpen,
    songVariantNotFound,
    voteAlreadySubmitted
} = require("../errors/domain.errors");

function createVoteService({
    voteRepository,
    runtimeRegistry,
    matchResultService
}) {
    async function submitVote({ matchId, playerId, songVariantId }) {
        const context = await voteRepository.findVotingContext(matchId);

        if (!context) {
            throw matchNotFound();
        }

        const runtime = runtimeRegistry?.getRuntime(context.sessionId);

        if (runtime && runtime.phase !== "VOTING") {
            throw votingNotOpen();
        }

        const isSessionPlayer = context.session.players.some(
            (sessionPlayer) => sessionPlayer.playerId === playerId
        );

        if (!isSessionPlayer) {
            throw playerNotInSession();
        }

        const variant = context.songVariants.find(
            (songVariant) => songVariant.id === songVariantId
        );

        if (!variant) {
            throw songVariantNotFound();
        }

        const alreadySubmitted = await voteRepository.findByMatchAndPlayer({
            matchId,
            playerId
        });

        if (alreadySubmitted) {
            throw voteAlreadySubmitted();
        }

        const vote = await voteRepository.createVote({
            matchId,
            playerId,
            songVariantId
        });

        let matchResult = null;

        if (
            matchResultService
        ) {
            const votes = await voteRepository.findByMatchId(matchId);

            if (votes.length === context.session.players.length) {
                matchResult = await matchResultService.finalizeMatch({
                    matchId
                });
            }
        }

        return {
            success: true,
            vote: {
                id: vote.id,
                matchId: vote.matchId,
                songVariantId: vote.songVariantId
            },
            votingComplete: Boolean(matchResult),
            matchResult: matchResult
                ? {
                    phase: "MATCH_RESULT",
                    winnerVariantIds: matchResult.winnerVariantIds
                }
                : null
        };
    }

    return {
        submitVote
    };
}

module.exports = {
    createVoteService
};

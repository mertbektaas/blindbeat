const {
    matchNotFound,
    votingNotOpen,
    votingNotComplete
} = require("../errors/domain.errors");
const {
    createVoteRepository
} = require("../repositories/vote.repository");
const {
    createSessionLeaderboardRepository
} = require("../repositories/session-leaderboard.repository");
const {
    calculateMatchScores
} = require("../game/match-scoring");

function createMatchResultService({
    prisma,
    runtimeRegistry,
    phaseStateMachine,
    unanimousVoteMultiplier = 2,
    createVoteRepository: createVoteRepositoryFn = createVoteRepository,
    createSessionLeaderboardRepository: createSessionLeaderboardRepositoryFn = createSessionLeaderboardRepository
}) {
    const finalizationByMatchId = new Map();

    async function finalizeMatchOnce({ matchId }) {
        let result;

        result = await prisma.$transaction(async (tx) => {
            const voteRepository = createVoteRepositoryFn(tx);
            const leaderboardRepository = createSessionLeaderboardRepositoryFn(tx);
            const context = await voteRepository.findVotingContext(matchId);

            if (!context) {
                throw matchNotFound();
            }

            const runtime = runtimeRegistry.getRuntime(context.sessionId);

            if (!runtime || runtime.phase !== "VOTING") {
                throw votingNotOpen();
            }

            if (context.votes.length < context.session.players.length) {
                throw votingNotComplete();
            }

            const scoring = calculateMatchScores({
                variants: context.songVariants,
                votes: context.votes,
                unanimousVoteMultiplier
            });

            for (const [playerId, points] of Object.entries(
                scoring.pointsByPlayer
            )) {
                if (leaderboardRepository.incrementScore) {
                    await leaderboardRepository.incrementScore({
                        sessionId: context.sessionId,
                        playerId: Number(playerId),
                        points
                    });
                } else {
                    const leaderboard = await leaderboardRepository.findBySessionAndPlayer({
                        sessionId: context.sessionId,
                        playerId: Number(playerId)
                    });

                    await leaderboardRepository.updateScore({
                        sessionId: context.sessionId,
                        playerId: Number(playerId),
                        totalScore: leaderboard.totalScore + points
                    });
                }
            }

            return {
                sessionId: context.sessionId,
                matchId,
                ...scoring
            };
        });

        const runtime = runtimeRegistry.getRuntime(result.sessionId);
        phaseStateMachine.transition(runtime, "MATCH_RESULT");
        runtime.matchResult = {
            matchId: result.matchId,
            winnerVariantIds: result.winnerVariantIds,
            voteCounts: result.voteCounts,
            tie: result.tie,
            unanimous: result.unanimous
        };

        return {
            success: true,
            ...result
        };
    }

    async function finalizeMatch({ matchId }) {
        const pendingFinalization = finalizationByMatchId.get(matchId);

        if (pendingFinalization) {
            return pendingFinalization;
        }

        const finalization = finalizeMatchOnce({ matchId });
        finalizationByMatchId.set(matchId, finalization);

        try {
            return await finalization;
        } finally {
            if (finalizationByMatchId.get(matchId) === finalization) {
                finalizationByMatchId.delete(matchId);
            }
        }
    }

    return {
        finalizeMatch
    };
}

module.exports = {
    createMatchResultService
};

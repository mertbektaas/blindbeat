const {
    matchNotFound,
    playerNotInSession
} = require("../errors/domain.errors");

function createLeaderboardService({
    prisma,
    sessionLeaderboardRepository
}) {
    async function getMatchLeaderboard({ matchId, playerId }) {
        const match = await prisma.match.findUnique({
            where: {
                id: matchId
            },
            select: {
                sessionId: true,
                session: {
                    select: {
                        players: {
                            select: {
                                playerId: true
                            }
                        }
                    }
                }
            }
        });

        if (!match) {
            throw matchNotFound();
        }

        const isSessionPlayer = match.session.players.some(
            (sessionPlayer) => sessionPlayer.playerId === playerId
        );

        if (!isSessionPlayer) {
            throw playerNotInSession();
        }

        const entries = await sessionLeaderboardRepository.findBySessionId(
            match.sessionId
        );

        return entries.map((entry, index) => ({
            rank: index + 1,
            nickname: entry.player.nickname,
            totalScore: entry.totalScore
        }));
    }

    return {
        getMatchLeaderboard
    };
}

module.exports = {
    createLeaderboardService
};

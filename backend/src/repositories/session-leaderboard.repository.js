function createSessionLeaderboardRepository(prisma) {
    return {
        createMany({
            sessionId,
            playerIds
        }) {
            const data = playerIds.map(playerId => ({
                sessionId,
                playerId,
                totalScore: 0
            }));

            return prisma.sessionLeaderboard.createMany({
                data
            });
        },

        findBySessionId(sessionId) {
            return prisma.sessionLeaderboard.findMany({
                where: {
                    sessionId
                },
                include: {
                    player: true
                },
                orderBy: {
                    totalScore: "desc"
                }
            });
        },

        findBySessionAndPlayer({
            sessionId,
            playerId
        }) {
            return prisma.sessionLeaderboard.findUnique({
                where: {
                    sessionId_playerId: {
                        sessionId,
                        playerId
                    }
                }
            });
        },

        updateScore({
            sessionId,
            playerId,
            totalScore
        }) {
            return prisma.sessionLeaderboard.update({
                where: {
                    sessionId_playerId: {
                        sessionId,
                        playerId
                    }
                },
                data: {
                    totalScore
                }
            });
        }
    };
}

module.exports = {
    createSessionLeaderboardRepository
};

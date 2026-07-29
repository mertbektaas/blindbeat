function createVoteRepository(prisma) {
    return {
        findVotingContext(matchId) {
            return prisma.match.findUnique({
                where: {
                    id: matchId
                },
                select: {
                    id: true,
                    sessionId: true,
                    session: {
                        select: {
                            players: {
                                select: {
                                    playerId: true
                                }
                            }
                        }
                    },
                    songVariants: {
                        select: {
                            id: true,
                            patterns: {
                                select: {
                                    pattern: {
                                        select: {
                                            playerId: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    votes: {
                        select: {
                            playerId: true,
                            songVariantId: true
                        }
                    }
                }
            });
        },

        findByMatchAndPlayer({ matchId, playerId }) {
            return prisma.vote.findUnique({
                where: {
                    matchId_playerId: {
                        matchId,
                        playerId
                    }
                }
            });
        },

        createVote({ matchId, playerId, songVariantId }) {
            return prisma.vote.create({
                data: {
                    matchId,
                    playerId,
                    songVariantId
                }
            });
        },

        findByMatchId(matchId) {
            return prisma.vote.findMany({
                where: {
                    matchId
                },
                orderBy: {
                    createdAt: "asc"
                }
            });
        }
    };
}

module.exports = {
    createVoteRepository
};

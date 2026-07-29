const {
    identityNotFound,
    matchNotFound
} = require("../errors/domain.errors");
const {
    createSongVariantRepository
} = require("../repositories/song-variant.repository");

function createPlaybackService({ prisma }) {
    const songVariantRepository = createSongVariantRepository(prisma);

    async function getMatchPlayback({ matchId, identity }) {
        const match = await prisma.match.findUnique({
            where: {
                id: matchId
            },
            include: {
                session: {
                    select: {
                        id: true,
                        lobbyId: true,
                        status: true,
                        bpm: true,
                        stepCount: true,
                        playbackLoops: true,
                        songVariantCount: true,
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
            ({ playerId }) => playerId === identity?.playerId
        );

        if (
            !identity
            || identity.lobbyId !== match.session.lobbyId
            || !isSessionPlayer
        ) {
            throw identityNotFound();
        }

        const variants = await songVariantRepository.findByMatchId({
            matchId
        });

        return {
            matchId,
            session: {
                id: match.session.id,
                status: match.session.status,
                bpm: match.session.bpm,
                stepCount: match.session.stepCount,
                playbackLoops: match.session.playbackLoops,
                songVariantCount: match.session.songVariantCount
            },
            variants: variants.map((variant) => ({
                id: variant.id,
                variantNo: variant.variantNo,
                patterns: variant.patterns.map((slot) => ({
                    patternId: slot.patternId,
                    instrumentId: slot.instrumentId,
                    instrumentCode: slot.instrument.code,
                    slotOrder: slot.slotOrder,
                    pattern: slot.pattern.patternData
                }))
            }))
        };
    }

    return {
        getMatchPlayback
    };
}

module.exports = {
    createPlaybackService
};

function createSongVariantRepository(prisma) {
    return {
        createSongVariant({
            matchId,
            variantNo
        }) {
            return prisma.songVariant.create({
                data: {
                    matchId,
                    variantNo
                }
            });
        },

        createSongVariantPatterns({
            songVariantId,
            patterns
        }) {
            return prisma.songVariantPattern.createMany({
                data: patterns.map(({ patternId, instrumentId, slotOrder }) => ({
                    songVariantId,
                    patternId,
                    instrumentId,
                    slotOrder
                }))
            });
        },

        findByMatchId({ matchId }) {
            return prisma.songVariant.findMany({
                where: {
                    matchId
                },
                orderBy: {
                    variantNo: "asc"
                },
                include: {
                    patterns: {
                        orderBy: {
                            slotOrder: "asc"
                        },
                        include: {
                            pattern: true,
                            instrument: true
                        }
                    }
                }
            });
        }
    };
}

module.exports = {
    createSongVariantRepository
};

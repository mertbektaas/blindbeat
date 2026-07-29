const {
    createSongAssemblyService
} = require("../src/services/song-assembly.service");

describe("SongAssemblyService", () => {
    test("snapshotten variantlari olusturur ve secilen patternleri tuketir", async () => {
        const tx = {
            pattern: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 101,
                        playerId: 10,
                        matchId: 4,
                        instrumentId: 2,
                        poolStatus: "ACTIVE"
                    },
                    {
                        id: 102,
                        playerId: 11,
                        matchId: 4,
                        instrumentId: 2,
                        poolStatus: "ACTIVE"
                    }
                ]),
                updateMany: jest.fn().mockResolvedValue({ count: 2 })
            },
            songVariant: {
                create: jest.fn()
                    .mockResolvedValueOnce({ id: 201, matchId: 4, variantNo: 1 })
                    .mockResolvedValueOnce({ id: 202, matchId: 4, variantNo: 2 }),
                findMany: jest.fn().mockResolvedValue([
                    { id: 201, matchId: 4, variantNo: 1, patterns: [] },
                    { id: 202, matchId: 4, variantNo: 2, patterns: [] }
                ])
            },
            songVariantPattern: {
                createMany: jest.fn().mockResolvedValue({ count: 1 })
            }
        };

        const prisma = {
            $transaction: jest.fn(async (callback) => callback(tx))
        };

        const service = createSongAssemblyService({ prisma });

        const result = await service.buildMatchSongVariants({
            sessionId: 9,
            matchId: 4,
            instrumentIds: [2],
            playerIds: [10, 11],
            variantCount: 2,
            currentMatchId: 4,
            randomFn: () => 0
        });

        expect(result.success).toBe(true);
        expect(result.matchId).toBe(4);
        expect(result.variants).toHaveLength(2);
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(tx.songVariant.create).toHaveBeenCalledTimes(2);
        expect(tx.songVariantPattern.createMany).toHaveBeenCalledTimes(2);
        expect(tx.songVariant.findMany).toHaveBeenCalledWith({
            where: {
                matchId: 4
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
        expect(tx.pattern.updateMany).toHaveBeenCalledWith({
            where: {
                id: { in: [101, 102] }
            },
            data: {
                poolStatus: "CONSUMED"
            }
        });
    });

    test("pattern havuzu yetersizse database yazimi yapmaz", async () => {
        const tx = {
            pattern: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 101,
                        playerId: 10,
                        matchId: 4,
                        instrumentId: 2,
                        poolStatus: "ACTIVE"
                    }
                ]),
                updateMany: jest.fn()
            },
            songVariant: {
                create: jest.fn()
            },
            songVariantPattern: {
                createMany: jest.fn()
            }
        };

        const prisma = {
            $transaction: jest.fn(async (callback) => callback(tx))
        };

        const service = createSongAssemblyService({ prisma });

        const result = await service.buildMatchSongVariants({
            sessionId: 9,
            matchId: 4,
            instrumentIds: [2],
            playerIds: [10, 11],
            variantCount: 2,
            currentMatchId: 4
        });

        expect(result).toBe(false);
        expect(tx.songVariant.create).not.toHaveBeenCalled();
        expect(tx.songVariantPattern.createMany).not.toHaveBeenCalled();
        expect(tx.pattern.updateMany).not.toHaveBeenCalled();
    });

    test("OG adaylarini kendi sarkilarina kaydeder", async () => {
        const tx = {
            songVariant: {
                create: jest.fn()
                    .mockResolvedValueOnce({ id: 301, matchId: 9, variantNo: 1 })
                    .mockResolvedValueOnce({ id: 302, matchId: 9, variantNo: 2 }),
                findMany: jest.fn().mockResolvedValue([
                    { id: 301, variantNo: 1, patterns: [] },
                    { id: 302, variantNo: 2, patterns: [] }
                ])
            },
            songVariantPattern: {
                createMany: jest.fn().mockResolvedValue({ count: 2 })
            }
        };
        const prisma = {
            $transaction: jest.fn(async (callback) => callback(tx))
        };

        const service = createSongAssemblyService({ prisma });

        const result = await service.buildOgRoundSongVariants({
            matchId: 9,
            instrumentIds: [2, 5],
            candidates: [
                {
                    playerId: 10,
                    patterns: [
                        { id: 1, instrumentId: 2 },
                        { id: 4, instrumentId: 5 }
                    ]
                },
                {
                    playerId: 11,
                    patterns: [
                        { id: 2, instrumentId: 2 },
                        { id: 5, instrumentId: 5 }
                    ]
                }
            ]
        });

        expect(result.success).toBe(true);
        expect(result.variants).toHaveLength(2);
        expect(tx.songVariant.create).toHaveBeenCalledTimes(2);
        expect(tx.songVariantPattern.createMany).toHaveBeenCalledTimes(2);
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
});

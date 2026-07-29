const {
    createSongVariantRepository
} = require("../src/repositories/song-variant.repository");

describe("SongVariantRepository", () => {
    test("song variant olusturur", async () => {
        const savedVariant = {
            id: 20,
            matchId: 7,
            variantNo: 1
        };

        const prisma = {
            songVariant: {
                create: jest.fn().mockResolvedValue(savedVariant)
            }
        };

        const repository = createSongVariantRepository(prisma);

        const result = await repository.createSongVariant({
            matchId: 7,
            variantNo: 1
        });

        expect(prisma.songVariant.create).toHaveBeenCalledWith({
            data: {
                matchId: 7,
                variantNo: 1
            }
        });
        expect(result).toEqual(savedVariant);
    });

    test("song variant pattern baglantilarini toplu olusturur", async () => {
        const createdLinks = { count: 2 };
        const prisma = {
            songVariantPattern: {
                createMany: jest.fn().mockResolvedValue(createdLinks)
            }
        };

        const repository = createSongVariantRepository(prisma);

        const result = await repository.createSongVariantPatterns({
            songVariantId: 20,
            patterns: [
                {
                    patternId: 101,
                    instrumentId: 2,
                    slotOrder: 1
                },
                {
                    patternId: 102,
                    instrumentId: 5,
                    slotOrder: 2
                }
            ]
        });

        expect(prisma.songVariantPattern.createMany).toHaveBeenCalledWith({
            data: [
                {
                    songVariantId: 20,
                    patternId: 101,
                    instrumentId: 2,
                    slotOrder: 1
                },
                {
                    songVariantId: 20,
                    patternId: 102,
                    instrumentId: 5,
                    slotOrder: 2
                }
            ]
        });
        expect(result).toEqual(createdLinks);
    });

    test("match variantlarini pattern ve instrument iliskileriyle getirir", async () => {
        const storedVariants = [
            {
                id: 20,
                matchId: 7,
                variantNo: 1,
                patterns: []
            }
        ];

        const prisma = {
            songVariant: {
                findMany: jest.fn().mockResolvedValue(storedVariants)
            }
        };

        const repository = createSongVariantRepository(prisma);
        const result = await repository.findByMatchId({ matchId: 7 });

        expect(prisma.songVariant.findMany).toHaveBeenCalledWith({
            where: {
                matchId: 7
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
        expect(result).toEqual(storedVariants);
    });
});

const { 
    createPatternRepository
} = require("../src/repositories/pattern.repository");

describe("PatternRepository", () => {
    test("pattern olusturur.", async () => {
        const fakePattern = {
            id: 3,
            playerId: 1,
            matchId: 1,
            instrumentId: 0, // kick,
            patternData: {
                steps: [
                    null,
                    null,
                    null
                ]
            }
        };

        const prisma = {
            pattern : {
                create: jest.fn().mockResolvedValue(fakePattern)
            }
        }

        const repository = createPatternRepository(prisma);

        const result = await repository.createPattern({
            playerId: 1,
            matchId: 1,
            instrumentId: 0, // kick,
            patternData: {
                steps: [
                    null,
                    null,
                    null
                ]
            }
        });

        expect(prisma.pattern.create).toHaveBeenCalledWith({
            data: {
                playerId: 1,
                matchId: 1,
                instrumentId: 0, // kick,
                patternData: {
                    steps: [
                        null,
                        null,
                        null
                    ]
                }
            }
        })

        expect(result).toEqual(fakePattern);
    });

    test("belirli enstrumanin aktif patternlerini getirir", async () => {
        
        const fakePatterns = [
            {
                id:0,
                matchId: 0,
                instrumentId : 0,
                poolStatus: "ACTIVE",
                patternData: {
                    steps: [
                        null,
                        null,
                        null
                    ]
                }
            },

            {
                id:1,
                matchId: 0,
                instrumentId : 0,
                poolStatus: "ACTIVE",
                patternData: {
                    steps: [
                        null,
                        null,
                        null
                    ]
                }
            },

            {
                id:2,
                matchId: 0,
                instrumentId : 0,
                poolStatus: "ACTIVE",
                patternData: {
                    steps: [
                        null,
                        null,
                        null
                    ]
                }
            }
        ];

        const prisma = {
            pattern: {
                findMany: jest.fn().mockResolvedValue(fakePatterns)
            }
        };

        const repository = createPatternRepository(prisma);

        const result = await repository.findActiveByInstrument(0);
    
        expect(prisma.pattern.findMany).toHaveBeenCalledWith({
            where : {
                instrumentId: 0,
                poolStatus: "ACTIVE"
            },

            orderBy: {
                createdAt: "asc"
            }

        });

        expect(result).toEqual(fakePatterns);
    });

    test("session icindeki secili enstrumanlarin aktif patternlerini getirir", async () => {
        const fakePatterns = [
            {
                id: 10,
                playerId: 1,
                matchId: 4,
                instrumentId: 2,
                poolStatus: "ACTIVE",
                patternData: { steps: [] }
            }
        ];

        const prisma = {
            pattern: {
                findMany: jest.fn().mockResolvedValue(fakePatterns)
            }
        };

        const repository = createPatternRepository(prisma);

        const result = await repository.getAllActivePatterns(9, [2, 5]);

        expect(prisma.pattern.findMany).toHaveBeenCalledWith({
            where: {
                instrumentId: { in: [2, 5] },
                poolStatus: "ACTIVE",
                match: {
                    sessionId: 9
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        expect(result).toEqual(fakePatterns);
    });

    test("pattern havuz durumunu gunceller", async () => {
        
        const fakePatternUpdate = {
            id: 0,
            poolStatus: "ARCHIVE"
        }

        const prisma = {
            pattern: {
                update: jest.fn().mockResolvedValue(fakePatternUpdate)
            }
        }

        const repository = createPatternRepository(prisma);

        const result = await repository.updatePoolStatus(0, "ARCHIVE");

        expect(prisma.pattern.update).toHaveBeenCalledWith({
            where: {
                id: 0
            },
            data: {
                poolStatus: "ARCHIVE"
            }
        });

        expect(result).toEqual(fakePatternUpdate);
    });

    test("session icindeki tied oyuncularin archive patternlerini getirir", async () => {
        const fakePatterns = [
            {
                id: 41,
                playerId: 2,
                matchId: 7,
                instrumentId: 10,
                poolStatus: "ARCHIVE"
            }
        ];

        const prisma = {
            pattern: {
                findMany: jest.fn().mockResolvedValue(fakePatterns)
            }
        };

        const repository = createPatternRepository(prisma);

        const result = await repository.findArchivedBySessionAndPlayers({
            sessionId: 5,
            playerIds: [2, 4],
            instrumentIds: [10, 11],
            excludedPatternIds: [30]
        });

        expect(prisma.pattern.findMany).toHaveBeenCalledWith({
            where: {
                poolStatus: "ARCHIVE",
                playerId: { in: [2, 4] },
                instrumentId: { in: [10, 11] },
                match: {
                    sessionId: 5
                },
                id: {
                    notIn: [30]
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        expect(result).toEqual(fakePatterns);
    });

    
});

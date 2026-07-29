const {
    createPatternPoolService
} = require("../src/services/pattern-pool.service");

describe("PatternPoolService", () => {
    test("aktif patternleri instrument idye gore gruplar", async () => {
        const patterns = [
            { id: 1, instrumentId: 2, playerId: 10 },
            { id: 2, instrumentId: 5, playerId: 11 },
            { id: 3, instrumentId: 2, playerId: 12 }
        ];

        const patternRepository = {
            getAllActivePatterns: jest.fn().mockResolvedValue(patterns)
        };

        const service = createPatternPoolService({ patternRepository });

        const result = await service.getPoolSnapshot({
            sessionId: 9,
            instrumentIds: [2, 5]
        });

        expect(patternRepository.getAllActivePatterns)
            .toHaveBeenCalledWith(9, [2, 5]);
        expect(result).toEqual({
            sessionId: 9,
            patternsByInstrument: {
                2: [patterns[0], patterns[2]],
                5: [patterns[1]]
            }
        });
    });

    test("patterni olmayan instrument icin bos liste olusturur", async () => {
        const patternRepository = {
            getAllActivePatterns: jest.fn().mockResolvedValue([])
        };

        const service = createPatternPoolService({ patternRepository });

        const result = await service.getPoolSnapshot({
            sessionId: 9,
            instrumentIds: [2, 5]
        });

        expect(result.patternsByInstrument).toEqual({
            2: [],
            5: []
        });
    });

    test("aktif limit asilirsa en eski patternleri archive yapar", async () => {
        const patterns = Array.from({ length: 4 }, (_, index) => ({
            id: index + 1,
            instrumentId: 2
        }));
        const patternRepository = {
            getAllActivePatterns: jest.fn().mockResolvedValue(patterns),
            updatePoolStatusMany: jest.fn().mockResolvedValue({ count: 2 })
        };

        const service = createPatternPoolService({ patternRepository });

        const result = await service.archiveOverflowPatterns({
            sessionId: 9,
            instrumentIds: [2],
            maxActivePatternCount: 2
        });

        expect(patternRepository.getAllActivePatterns)
            .toHaveBeenCalledWith(9, [2]);
        expect(patternRepository.updatePoolStatusMany)
            .toHaveBeenCalledWith({
                patternIds: [1, 2],
                poolStatus: "ARCHIVE"
            });
        expect(result).toEqual({
            archivedPatternIds: [1, 2],
            archivedCount: 2
        });
    });
});

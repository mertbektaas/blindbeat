const {
    createPatternService
} = require("../src/services/pattern.service");

describe("PatternService", () => {
    test("gecerli patterni repositorye kaydeder", async () => {
        
        const validPattern = {
            version: 1,
            instrumentType: "bass",
            stepCount: 3,
            data: {
                steps: [
                    null,
                    {
                        note: "C3",
                        velocity: 0.8
                    },
                    null
                ]
            }
        };

        const savedPattern = {
            id: 10,
            playerId: 1,
            matchId: 1,
            instrumentId: 4,
            patternData: validPattern
        };

        const patternRepository = {
            createPattern: jest.fn().mockResolvedValue(savedPattern)
        };

        const service = createPatternService({
            patternRepository
        });

        const result = await service.submitPattern({
            playerId: 1,
            matchId: 1,
            instrumentId: 4,
            patternData: validPattern
        });

        expect(patternRepository.createPattern).toHaveBeenCalledWith({
            playerId: 1,
            matchId: 1,
            instrumentId: 4,
            patternData: validPattern
        });

        expect(result).toEqual({
            success: true,
            pattern: savedPattern
        });
    });

    test("gecersiz patterni repositorye kaydetmez", async () => {
        const invalidPattern = {
            version: 1,
            instrumentType: "bass",
            stepCount: 3,
            data: {
                steps: [
                    null,
                    {
                        note: "C3",
                        velocity: 1.5
                    },
                    null
                ]
            }
        };

        const patternRepository = {
            createPattern: jest.fn()
        };

        const service = createPatternService({
            patternRepository
        });

        const result = await service.submitPattern({
            playerId: 1,
            matchId: 1,
            instrumentId: 4,
            patternData: invalidPattern
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(patternRepository.createPattern).not.toHaveBeenCalled();
    });
});

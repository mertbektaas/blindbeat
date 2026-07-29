const {
    createMatchRepository
} = require("../src/repositories/match.repository");

describe("MatchRepository", () => {
    test("match olusturur", async () => {
        const savedMatch = {
            id: 500,
            sessionId: 100,
            matchNumber: 1
        };
        const prisma = {
            match: {
                create: jest.fn().mockResolvedValue(savedMatch)
            }
        };
        const repository = createMatchRepository(prisma);

        const result = await repository.createMatch({
            sessionId: 100,
            matchNumber: 1
        });

        expect(prisma.match.create).toHaveBeenCalledWith({
            data: {
                sessionId: 100,
                matchNumber: 1
            }
        });
        expect(result).toEqual(savedMatch);
    });

    test("id ile match bulur", async () => {
        const savedMatch = {
            id: 500,
            sessionId: 100,
            matchNumber: 1
        };
        const prisma = {
            match: {
                findUnique: jest.fn().mockResolvedValue(savedMatch)
            }
        };
        const repository = createMatchRepository(prisma);

        const result = await repository.findMatchById(500);

        expect(prisma.match.findUnique).toHaveBeenCalledWith({
            where: {
                id: 500
            }
        });
        expect(result).toEqual(savedMatch);
    });

    test("session ve match numarasi ile match bulur", async () => {
        const savedMatch = {
            id: 500,
            sessionId: 100,
            matchNumber: 1
        };
        const prisma = {
            match: {
                findUnique: jest.fn().mockResolvedValue(savedMatch)
            }
        };
        const repository = createMatchRepository(prisma);

        const result = await repository.findMatchBySessionAndNumber({
            sessionId: 100,
            matchNumber: 1
        });

        expect(prisma.match.findUnique).toHaveBeenCalledWith({
            where: {
                sessionId_matchNumber: {
                    sessionId: 100,
                    matchNumber: 1
                }
            }
        });
        expect(result).toEqual(savedMatch);
    });
});

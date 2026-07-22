const {
    createSessionInstrumentRepository
} = require("../src/repositories/session-instrument.repository");

describe("SessionInstrumentRepository", () => {
    test("sessiona sirali instrumentleri toplu ekler", async () => {
        const fakeCreateManyResult = {
            count: 2
        };

        const prisma = {
            sessionInstrument: {
                createMany: jest.fn().mockResolvedValue(fakeCreateManyResult)
            }
        };

        const repository = createSessionInstrumentRepository(prisma);

        const result = await repository.createMany({
            sessionId: 1,
            instruments: [
                {
                    instrumentId: 3,
                    orderNo: 1
                },
                {
                    instrumentId: 5,
                    orderNo: 2
                }
            ]
        });

        expect(prisma.sessionInstrument.createMany).toHaveBeenCalledWith({
            data: [
                {
                    sessionId: 1,
                    instrumentId: 3,
                    orderNo: 1
                },
                {
                    sessionId: 1,
                    instrumentId: 5,
                    orderNo: 2
                }
            ]
        });

        expect(result).toEqual(fakeCreateManyResult);
    });

    test("session instrumentlerini instrument iliskisiyle sirali getirir", async () => {
        const fakeSessionInstruments = [
            {
                sessionId: 1,
                instrumentId: 3,
                orderNo: 1,
                instrument: {
                    code: "kick"
                }
            },
            {
                sessionId: 1,
                instrumentId: 5,
                orderNo: 2,
                instrument: {
                    code: "bass"
                }
            }
        ];

        const prisma = {
            sessionInstrument: {
                findMany: jest.fn().mockResolvedValue(fakeSessionInstruments)
            }
        };

        const repository = createSessionInstrumentRepository(prisma);

        const result = await repository.findBySessionId(1);

        expect(prisma.sessionInstrument.findMany).toHaveBeenCalledWith({
            where: {
                sessionId: 1
            },
            include: {
                instrument: true
            },
            orderBy: {
                orderNo: "asc"
            }
        });

        expect(result).toEqual(fakeSessionInstruments);
    });

    test("session ve instrument eslesmesini composite key ile bulur", async () => {
        const fakeSessionInstrument = {
            sessionId: 1,
            instrumentId: 3,
            orderNo: 1
        };

        const prisma = {
            sessionInstrument: {
                findUnique: jest.fn().mockResolvedValue(fakeSessionInstrument)
            }
        };

        const repository = createSessionInstrumentRepository(prisma);

        const result = await repository.findBySessionAndInstrument({
            sessionId: 1,
            instrumentId: 3
        });

        expect(prisma.sessionInstrument.findUnique).toHaveBeenCalledWith({
            where: {
                sessionId_instrumentId: {
                    sessionId: 1,
                    instrumentId: 3
                }
            }
        });

        expect(result).toEqual(fakeSessionInstrument);
    });

    test("sessiondaki instrument sayisini getirir", async () => {
        const prisma = {
            sessionInstrument: {
                count: jest.fn().mockResolvedValue(5)
            }
        };

        const repository = createSessionInstrumentRepository(prisma);

        const result = await repository.countBySessionId(1);

        expect(prisma.sessionInstrument.count).toHaveBeenCalledWith({
            where: {
                sessionId: 1
            }
        });

        expect(result).toBe(5);
    });
});

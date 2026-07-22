const {
    createSessionRepository
} = require("../src/repositories/session.repository");

describe("SessionRepository", () => {
    test("snapshot ayarlariyla session olusturur", async () => {
        const fakeSession = {
            id: 1,
            lobbyId: 10,
            status: "WAITING",
            maxMatchCount: 5,
            bpm: 120,
            stepCount: 8,
            instrumentRoundSeconds: 30,
            playbackLoops: 5,
            songVariantCount: 3
        };

        const prisma = {
            session: {
                create: jest.fn().mockResolvedValue(fakeSession)
            }
        };

        const repository = createSessionRepository(prisma);

        const result = await repository.createSession({
            lobbyId: 10,
            maxMatchCount: 5,
            bpm: 120,
            stepCount: 8,
            instrumentRoundSeconds: 30,
            playbackLoops: 5,
            songVariantCount: 3,
            status: "WAITING"
        });

        expect(prisma.session.create).toHaveBeenCalledWith({
            data: {
                lobbyId: 10,
                maxMatchCount: 5,
                bpm: 120,
                stepCount: 8,
                instrumentRoundSeconds: 30,
                playbackLoops: 5,
                songVariantCount: 3,
                status: "WAITING"
            }
        });

        expect(result).toEqual(fakeSession);
    });

    test("sessioni id ile getirir", async () => {
        const fakeSession = {
            id: 1,
            lobbyId: 10,
            status: "RUNNING"
        };

        const prisma = {
            session: {
                findUnique: jest.fn().mockResolvedValue(fakeSession)
            }
        };

        const repository = createSessionRepository(prisma);

        const result = await repository.findById(1);

        expect(prisma.session.findUnique).toHaveBeenCalledWith({
            where: {
                id: 1
            }
        });

        expect(result).toEqual(fakeSession);
    });

    test("sessioni instrumentleriyle ve sirali getirir", async () => {
        const fakeSession = {
            id: 1,
            lobbyId: 10,
            sessionInstruments: [
                {
                    orderNo: 1,
                    instrument: {
                        code: "kick"
                    }
                },
                {
                    orderNo: 2,
                    instrument: {
                        code: "bass"
                    }
                }
            ]
        };

        const prisma = {
            session: {
                findUnique: jest.fn().mockResolvedValue(fakeSession)
            }
        };

        const repository = createSessionRepository(prisma);

        const result = await repository.findByIdWithInstruments(1);

        expect(prisma.session.findUnique).toHaveBeenCalledWith({
            where: {
                id: 1
            },
            include: {
                sessionInstruments: {
                    include: {
                        instrument: true
                    },
                    orderBy: {
                        orderNo: "asc"
                    }
                }
            }
        });

        expect(result).toEqual(fakeSession);
    });

    test("lobby ve status bilgisine gore session bulur", async () => {
        const fakeSession = {
            id: 1,
            lobbyId: 10,
            status: "RUNNING"
        };

        const prisma = {
            session: {
                findFirst: jest.fn().mockResolvedValue(fakeSession)
            }
        };

        const repository = createSessionRepository(prisma);

        const result = await repository.findByLobbyAndStatus({
            lobbyId: 10,
            status: "RUNNING"
        });

        expect(prisma.session.findFirst).toHaveBeenCalledWith({
            where: {
                lobbyId: 10,
                status: "RUNNING"
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        expect(result).toEqual(fakeSession);
    });

    test("session statusunu gunceller", async () => {
        const fakeUpdatedSession = {
            id: 1,
            status: "COMPLETED"
        };

        const prisma = {
            session: {
                update: jest.fn().mockResolvedValue(fakeUpdatedSession)
            }
        };

        const repository = createSessionRepository(prisma);

        const result = await repository.updateStatus(1, "COMPLETED");

        expect(prisma.session.update).toHaveBeenCalledWith({
            where: {
                id: 1
            },
            data: {
                status: "COMPLETED"
            }
        });

        expect(result).toEqual(fakeUpdatedSession);
    });
});

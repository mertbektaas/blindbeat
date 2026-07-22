const {
    createLobbyRepository
} = require("../src/repositories/lobby.repository");

describe("LobbyRepository", () => {
    test("lobi olusturur", async () => {
        const fakeLobby = {
            id: 1,
            code: "ABCD",
            status: "OPEN"
        };

        const prisma = {
            lobby: {
                create: jest.fn().mockResolvedValue(fakeLobby)
            }
        };

        const repository = createLobbyRepository(prisma);

        const result = await repository.createLobby("ABCD", "OPEN");

        expect(prisma.lobby.create).toHaveBeenCalledWith({
            data: {
                code: "ABCD",
                status: "OPEN"
            }
        });

        expect(result).toEqual(fakeLobby);
    });

    test("koda gore lobi getirir", async () => {
        const fakeLobby = {
            id: 1,
            code: "ABCD",
            status: "OPEN"
        };

        const prisma = {
            lobby: {
                findUnique: jest.fn().mockResolvedValue(fakeLobby)
            }
        };

        const repository = createLobbyRepository(prisma);

        const result = await repository.findByCode("ABCD");

        expect(prisma.lobby.findUnique).toHaveBeenCalledWith({
            where: {
                code: "ABCD"
            }
        });

        expect(result).toEqual(fakeLobby);
    });

    test("koda gore lobiyi oyunculariyla birlikte getirir", async () => {
        const fakeLobby = {
            id: 1,
            code: "ABCD",
            status: "OPEN",
            players: [
                {
                    id: 7,
                    nickname: "mert"
                }
            ]
        };

        const prisma = {
            lobby: {
                findUnique: jest.fn().mockResolvedValue(fakeLobby)
            }
        };

        const repository = createLobbyRepository(prisma);

        const result = await repository.findByCodeWithPlayers("ABCD");

        expect(prisma.lobby.findUnique).toHaveBeenCalledWith({
            where: {
                code: "ABCD"
            },
            include: {
                players: true
            }
        });

        expect(result).toEqual(fakeLobby);
    });

    test("lobinin durumunu gunceller", async () => {
        const fakeUpdatedLobby = {
            id: 1,
            code: "ABCD",
            status: "IN_SESSION"
        };

        const prisma = {
            lobby: {
                update: jest.fn().mockResolvedValue(fakeUpdatedLobby)
            }
        };

        const repository = createLobbyRepository(prisma);

        const result = await repository.updateStatus(1, "IN_SESSION");

        expect(prisma.lobby.update).toHaveBeenCalledWith({
            where: {
                id: 1
            },
            data: {
                status: "IN_SESSION"
            }
        });

        expect(result).toEqual(fakeUpdatedLobby);
    });

    test("lobi id ile silinir", async () => {
        const fakeDeletedLobby = {
            id: 1,
            code: "ABCD",
            status: "CLOSED"
        };

        const prisma = {
            lobby: {
                delete: jest.fn().mockResolvedValue(fakeDeletedLobby)
            }
        };

        const repository = createLobbyRepository(prisma);

        const result = await repository.deleteById(1);

        expect(prisma.lobby.delete).toHaveBeenCalledWith({
            where: {
                id: 1
            }
        });

        expect(result).toEqual(fakeDeletedLobby);
    });
});

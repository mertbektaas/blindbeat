const {
    createPlayerRepository
} = require("../src/repositories/player.repository");

describe("PlayerRepository", () => {
    test("lobby icinde player olusturur", async () => {
        const fakePlayer = {
            id: 1,
            nickname: "mert",
            lobbyId: 10
        };

        const prisma = {
            player: {
                create: jest.fn().mockResolvedValue(fakePlayer)
            }
        };

        const repository = createPlayerRepository(prisma);

        const result = await repository.createPlayer({
            nickname: "mert",
            lobbyId: 10
        });

        expect(prisma.player.create).toHaveBeenCalledWith({
            data: {
                nickname: "mert",
                lobbyId: 10
            }
        });

        expect(result).toEqual(fakePlayer);
    });

    test("lobby icinde nickname ile player bulur", async () => {
        const fakePlayer = {
            id: 1,
            nickname: "mert",
            lobbyId: 10
        };

        const prisma = {
            player: {
                findUnique: jest.fn().mockResolvedValue(fakePlayer)
            }
        };

        const repository = createPlayerRepository(prisma);

        const result = await repository.findByLobbyAndNickname({
            lobbyId: 10,
            nickname: "mert"
        });

        expect(prisma.player.findUnique).toHaveBeenCalledWith({
            where: {
                lobbyId_nickname: {
                    lobbyId: 10,
                    nickname: "mert"
                }
            }
        });

        expect(result).toEqual(fakePlayer);
    });

    test("playeri lobby iliskisiyle birlikte getirir", async () => {
        const fakePlayer = {
            id: 1,
            nickname: "mert",
            lobbyId: 10,
            lobby: {
                id: 10,
                code: "ABCD"
            }
        };

        const prisma = {
            player: {
                findUnique: jest.fn().mockResolvedValue(fakePlayer)
            }
        };

        const repository = createPlayerRepository(prisma);

        const result = await repository.findByIdWithLobby(1);

        expect(prisma.player.findUnique).toHaveBeenCalledWith({
            where: {
                id: 1
            },
            include: {
                lobby: true
            }
        });

        expect(result).toEqual(fakePlayer);
    });

    test("lobbydeki playerlari olusturulma tarihine gore getirir", async () => {
        const fakePlayers = [
            {
                id: 1,
                nickname: "mert",
                lobbyId: 10
            },
            {
                id: 2,
                nickname: "ali",
                lobbyId: 10
            }
        ];

        const prisma = {
            player: {
                findMany: jest.fn().mockResolvedValue(fakePlayers)
            }
        };

        const repository = createPlayerRepository(prisma);

        const result = await repository.findAllByLobbyId(10);

        expect(prisma.player.findMany).toHaveBeenCalledWith({
            where: {
                lobbyId: 10
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        expect(result).toEqual(fakePlayers);
    });

    test("playeri id ile siler", async () => {
        const fakeDeletedPlayer = {
            id: 1,
            nickname: "mert",
            lobbyId: 10
        };

        const prisma = {
            player: {
                delete: jest.fn().mockResolvedValue(fakeDeletedPlayer)
            }
        };

        const repository = createPlayerRepository(prisma);

        const result = await repository.deleteById(1);

        expect(prisma.player.delete).toHaveBeenCalledWith({
            where: {
                id: 1
            }
        });

        expect(result).toEqual(fakeDeletedPlayer);
    });
});

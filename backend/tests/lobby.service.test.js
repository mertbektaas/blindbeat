const {
    createLobbyService
} = require("../src/services/lobby.service");

describe("LobbyService", () => {
    test("lobby, player ve identity olusturur", async () => {
        const fakeLobby = {
            id: 1,
            code: "ABCD",
            status: "OPEN"
        };

        const fakePlayer = {
            id: 5,
            lobbyId: 1,
            nickname: "Mert"
        };

        const fakeIdentity = {
            token: "token-123",
            identity: {
                playerId: 5,
                lobbyId: 1,
                nickname: "Mert"
            }
        };

        const tx = {
            lobby: {
                create: jest.fn().mockResolvedValue(fakeLobby),
                findUnique: jest.fn().mockResolvedValue(fakeLobby)
            },
            player: {
                create: jest.fn().mockResolvedValue(fakePlayer)
            }
        };

        const prisma = {
            $transaction: jest.fn(async callback => callback(tx))
        };

        const identityRegistry = {
            create: jest.fn().mockReturnValue(fakeIdentity)
        };

        const generateLobbyCode = jest.fn().mockReturnValue("ABCD");

        const service = createLobbyService({
            prisma,
            identityRegistry,
            generateLobbyCode
        });

        const result = await service.createLobby({
            nickname: "Mert"
        });

        expect(generateLobbyCode).toHaveBeenCalledTimes(1);
        expect(tx.lobby.create).toHaveBeenCalledWith({
            data: {
                code: "ABCD",
                status: "OPEN"
            }
        });
        expect(tx.player.create).toHaveBeenCalledWith({
            data: {
                nickname: "Mert",
                lobbyId: 1
            }
        });
        expect(identityRegistry.create).toHaveBeenCalledWith({
            playerId: 5,
            lobbyId: 1,
            nickname: "Mert"
        });
        expect(result).toEqual({
            lobby: fakeLobby,
            player: fakePlayer,
            identity: fakeIdentity
        });
    });

    test("transaction hata verirse identity olusturmaz", async () => {
        const databaseError = new Error("player create failed");

        const tx = {
            lobby: {
                create: jest.fn().mockResolvedValue({
                    id: 1,
                    code: "ABCD",
                    status: "OPEN"
                })
            },
            player: {
                create: jest.fn().mockRejectedValue(databaseError)
            }
        };

        const prisma = {
            $transaction: jest.fn(async callback => callback(tx))
        };

        const identityRegistry = {
            create: jest.fn()
        };

        const service = createLobbyService({
            prisma,
            identityRegistry,
            generateLobbyCode: () => "ABCD"
        });

        await expect(
            service.createLobby({ nickname: "Mert" })
        ).rejects.toBe(databaseError);

        expect(identityRegistry.create).not.toHaveBeenCalled();
    });

    function createJoinTestService({
        lobby,
        existingPlayer = null,
        createdPlayer = {
            id: 6,
            lobbyId: 1,
            nickname: "Ali"
        },
        playerCreateError
    }) {
        const tx = {
            lobby: {
                findUnique: jest.fn().mockResolvedValue(lobby)
            },
            player: {
                findUnique: jest.fn().mockResolvedValue(existingPlayer),
                create: playerCreateError
                    ? jest.fn().mockRejectedValue(playerCreateError)
                    : jest.fn().mockResolvedValue(createdPlayer)
            }
        };

        const prisma = {
            $transaction: jest.fn(async callback => callback(tx))
        };

        const identityRegistry = {
            create: jest.fn().mockReturnValue({
                token: "token-join",
                identity: createdPlayer
            })
        };

        return {
            service: createLobbyService({
                prisma,
                identityRegistry,
                generateLobbyCode: () => "ABCD"
            }),
            identityRegistry
        };
    }

    test("acik lobbyye player ekler ve identity olusturur", async () => {
        const createdPlayer = {
            id: 6,
            lobbyId: 1,
            nickname: "Ali"
        };

        const { service, identityRegistry } = createJoinTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: []
            },
            createdPlayer
        });

        const result = await service.joinLobby({
            lobbyCode: "ABCD",
            nickname: "Ali"
        });

        expect(result.player).toEqual(createdPlayer);
        expect(identityRegistry.create).toHaveBeenCalledWith({
            playerId: 6,
            lobbyId: 1,
            nickname: "Ali"
        });
    });

    test("bulunamayan lobby icin hata verir", async () => {
        const { service, identityRegistry } = createJoinTestService({
            lobby: null
        });

        await expect(
            service.joinLobby({
                lobbyCode: "YOK1",
                nickname: "Ali"
            })
        ).rejects.toMatchObject({
            code: "LOBBY_NOT_FOUND",
            statusCode: 404
        });

        expect(identityRegistry.create).not.toHaveBeenCalled();
    });

    test("acik olmayan lobbyye katilmayi reddeder", async () => {
        const { service } = createJoinTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "IN_SESSION",
                players: []
            }
        });

        await expect(
            service.joinLobby({
                lobbyCode: "ABCD",
                nickname: "Ali"
            })
        ).rejects.toMatchObject({
            code: "LOBBY_LOCKED",
            statusCode: 409
        });
    });

    test("dolu lobbyye katilmayi reddeder", async () => {
        const { service } = createJoinTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: Array.from({ length: 10 })
            }
        });

        await expect(
            service.joinLobby({
                lobbyCode: "ABCD",
                nickname: "Ali"
            })
        ).rejects.toMatchObject({
            code: "LOBBY_FULL",
            statusCode: 409
        });
    });

    test("ayni nickname ile ikinci kez katilmayi reddeder", async () => {
        const { service } = createJoinTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: []
            },
            existingPlayer: {
                id: 5,
                lobbyId: 1,
                nickname: "Ali"
            }
        });

        await expect(
            service.joinLobby({
                lobbyCode: "ABCD",
                nickname: "Ali"
            })
        ).rejects.toMatchObject({
            code: "NICKNAME_TAKEN",
            statusCode: 409
        });
    });

    test("player kaydi P2002 ile patlarsa domain hatasina cevirir", async () => {
        const { service } = createJoinTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: []
            },
            playerCreateError: {
                code: "P2002",
                meta: {
                    target: ["lobbyId", "nickname"]
                }
            }
        });

        await expect(
            service.joinLobby({
                lobbyCode: "ABCD",
                nickname: "Ali"
            })
        ).rejects.toMatchObject({
            code: "NICKNAME_TAKEN",
            statusCode: 409
        });
    });

    function createLeaveTestService({
        lobby,
        identity = {
            playerId: 5,
            lobbyId: 1,
            nickname: "Mert"
        }
    }) {
        const tx = {
            lobby: {
                findUnique: jest.fn().mockResolvedValue(lobby),
                delete: jest.fn().mockResolvedValue(lobby)
            },
            player: {
                delete: jest.fn().mockResolvedValue({
                    id: identity.playerId,
                    lobbyId: identity.lobbyId,
                    nickname: identity.nickname
                })
            }
        };

        const prisma = {
            $transaction: jest.fn(async callback => callback(tx))
        };

        const identityRegistry = {
            delete: jest.fn().mockReturnValue(true)
        };

        return {
            service: createLobbyService({
                prisma,
                identityRegistry,
                generateLobbyCode: () => "ABCD"
            }),
            tx,
            identityRegistry
        };
    }

    test("son oyuncu degilse sadece player silinir", async () => {
        const { service, tx, identityRegistry } = createLeaveTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: [
                    { id: 5, nickname: "Mert" },
                    { id: 6, nickname: "Ali" }
                ]
            }
        });

        const result = await service.leaveLobby({
            lobbyCode: "ABCD",
            identity: {
                playerId: 5,
                lobbyId: 1,
                nickname: "Mert"
            },
            token: "token-leave"
        });

        expect(tx.player.delete).toHaveBeenCalledWith({
            where: { id: 5 }
        });
        expect(tx.lobby.delete).not.toHaveBeenCalled();
        expect(identityRegistry.delete).toHaveBeenCalledWith("token-leave");
        expect(result.lobbyDeleted).toBe(false);
    });

    test("son oyuncu cikarsa player ve lobby silinir", async () => {
        const { service, tx } = createLeaveTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: [{ id: 5, nickname: "Mert" }]
            }
        });

        const result = await service.leaveLobby({
            lobbyCode: "ABCD",
            identity: {
                playerId: 5,
                lobbyId: 1,
                nickname: "Mert"
            },
            token: "token-leave"
        });

        expect(tx.player.delete).toHaveBeenCalledWith({
            where: { id: 5 }
        });
        expect(tx.lobby.delete).toHaveBeenCalledWith({
            where: { id: 1 }
        });
        expect(result.lobbyDeleted).toBe(true);
    });

    test("kilitli lobbyden ayrilma istegini reddeder", async () => {
        const { service, tx, identityRegistry } = createLeaveTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "IN_SESSION",
                players: [{ id: 5, nickname: "Mert" }]
            }
        });

        await expect(
            service.leaveLobby({
                lobbyCode: "ABCD",
                identity: {
                    playerId: 5,
                    lobbyId: 1,
                    nickname: "Mert"
                },
                token: "token-leave"
            })
        ).rejects.toMatchObject({
            code: "LOBBY_LOCKED",
            statusCode: 409
        });

        expect(tx.player.delete).not.toHaveBeenCalled();
        expect(identityRegistry.delete).not.toHaveBeenCalled();
    });

    test("identity lobbydeki player ile eslesmiyorsa ayrilmayi reddeder", async () => {
        const { service, tx, identityRegistry } = createLeaveTestService({
            lobby: {
                id: 1,
                code: "ABCD",
                status: "OPEN",
                players: [{ id: 6, nickname: "Ali" }]
            }
        });

        await expect(
            service.leaveLobby({
                lobbyCode: "ABCD",
                identity: {
                    playerId: 5,
                    lobbyId: 1,
                    nickname: "Mert"
                },
                token: "token-leave"
            })
        ).rejects.toMatchObject({
            code: "IDENTITY_NOT_FOUND",
            statusCode: 401
        });

        expect(tx.player.delete).not.toHaveBeenCalled();
        expect(identityRegistry.delete).not.toHaveBeenCalled();
    });
});

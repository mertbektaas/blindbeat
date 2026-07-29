const {
    createPlaybackService
} = require("../src/services/playback.service");

describe("PlaybackService", () => {
    test("match playback verisini oyuncu bilgisini gizleyerek doner", async () => {
        const prisma = {
            match: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 7,
                    session: {
                        id: 4,
                        lobbyId: 2,
                        status: "RUNNING",
                        bpm: 120,
                        stepCount: 8,
                        playbackLoops: 5,
                        songVariantCount: 3,
                        players: [{ playerId: 10 }]
                    }
                })
            },
            songVariant: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        variantNo: 1,
                        patterns: [
                            {
                                patternId: 20,
                                instrumentId: 3,
                                slotOrder: 1,
                                pattern: {
                                    playerId: 10,
                                    patternData: {
                                        version: 1,
                                        instrumentType: "drums",
                                        stepCount: 1,
                                        data: {
                                            steps: [{
                                                kick: true,
                                                snare: false,
                                                hiHat: true
                                            }]
                                        }
                                    }
                                },
                                instrument: {
                                    code: "drums"
                                }
                            }
                        ]
                    }
                ])
            }
        };

        const service = createPlaybackService({ prisma });
        const result = await service.getMatchPlayback({
            matchId: 7,
            identity: {
                playerId: 10,
                lobbyId: 2
            }
        });

        expect(result.variants[0].patterns[0]).toEqual({
            patternId: 20,
            instrumentId: 3,
            instrumentCode: "drums",
            slotOrder: 1,
            pattern: expect.any(Object)
        });
        expect(result.variants[0].patterns[0]).not.toHaveProperty(
            "playerId"
        );
    });

    test("session oyuncusu olmayan kisi playback alamaz", async () => {
        const prisma = {
            match: {
                findUnique: jest.fn().mockResolvedValue({
                    session: {
                        id: 4,
                        lobbyId: 2,
                        players: [{ playerId: 10 }]
                    }
                })
            },
            songVariant: {
                findMany: jest.fn()
            }
        };

        const service = createPlaybackService({ prisma });

        await expect(service.getMatchPlayback({
            matchId: 7,
            identity: {
                playerId: 99,
                lobbyId: 2
            }
        })).rejects.toMatchObject({
            code: "IDENTITY_NOT_FOUND"
        });

        expect(prisma.songVariant.findMany).not.toHaveBeenCalled();
    });
});

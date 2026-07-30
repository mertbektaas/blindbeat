const {
    createGameStateSnapshot
} = require("../src/game/game-state.snapshot");

describe("GameStateSnapshot", () => {
    function createRuntime() {
        return {
            sessionId: 12,
            matchNumber: 2,
            currentMatchId: 22,
            phase: "INSTRUMENT_ROUND",
            currentInstrumentIndex: 1,
            currentInstrumentId: 8,
            roundStartedAt: new Date("2026-07-23T12:00:00.000Z"),
            deadlineAt: new Date("2026-07-23T12:00:30.000Z"),
            stateVersion: 7,
            variantOrder: [2, 1, 3],
            matchResult: {
                matchId: 22,
                winnerVariantIds: [101],
                voteCounts: { 101: 2, 102: 0, 103: 0 },
                tie: false,
                unanimous: true
            },
            players: new Map([
                [1, {
                    playerId: 1,
                    draftPattern: {
                        steps: [true, false]
                    },
                    locked: false,
                    connected: true,
                    ready: true
                }],
                [2, {
                    playerId: 2,
                    draftPattern: {
                        steps: [false, true]
                    },
                    locked: true,
                    connected: true,
                    ready: true
                }]
            ])
        };
    }

    test("runtime bilgilerini snapshot olarak doner", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 1);

        expect(snapshot).toMatchObject({
            sessionId: 12,
            matchNumber: 2,
            currentMatchId: 22,
            variantOrder: [2, 1, 3],
            phase: "INSTRUMENT_ROUND",
            currentInstrumentIndex: 1,
            currentInstrumentId: 8,
            stateVersion: 7
        });
    });

    test("tarihleri ISO string formatina cevirir", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 1);

        expect(snapshot.roundStartedAt).toBe("2026-07-23T12:00:00.000Z");
        expect(snapshot.deadlineAt).toBe("2026-07-23T12:00:30.000Z");
    });

    test("match sonucunu guvenli ozet olarak doner", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 1);

        expect(snapshot.matchResult).toEqual({
            matchId: 22,
            winnerVariantIds: [101],
            voteCounts: { 101: 2, 102: 0, 103: 0 },
            tie: false,
            unanimous: true
        });
        expect(snapshot.matchResult).not.toHaveProperty("pointsByPlayer");
    });

    test("oyunculari Map yerine dizi olarak ve durumlariyla doner", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 1);

        expect(snapshot.players).toEqual([
            {
                playerId: 1,
                locked: false,
                connected: true,
                ready: true,
                matchResultReady: false
            },
            {
                playerId: 2,
                locked: true,
                connected: true,
                ready: true,
                matchResultReady: false
            }
        ]);
    });

    test("goruntuleyen oyuncuya kendi draftini doner", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 1);

        expect(snapshot.myDraftPattern).toEqual({
            steps: [true, false]
        });
    });

    test("diger oyuncularin draftlarini snapshot icinde gostermez", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 1);

        expect(snapshot.players[0]).not.toHaveProperty("draftPattern");
        expect(snapshot.players[1]).not.toHaveProperty("draftPattern");
        expect(snapshot.myDraftPattern).not.toEqual({
            steps: [false, true]
        });
    });

    test("olmayan oyuncu icin kendi drafti null doner", () => {
        const snapshot = createGameStateSnapshot(createRuntime(), 99);

        expect(snapshot.myDraftPattern).toBeNull();
    });
});

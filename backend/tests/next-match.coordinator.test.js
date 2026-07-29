const {
    createNextMatchCoordinator
} = require("../src/services/next-match.coordinator");

describe("NextMatchCoordinator", () => {
    test("yeni match acar ve oyuncu round durumlarini temizler", async () => {
        const runtime = {
            sessionId: 9,
            matchNumber: 1,
            currentMatchId: 10,
            matchResult: { winnerVariantIds: [1] },
            playbackStartAt: "old",
            variantOrder: [1, 2, 3],
            currentInstrumentIndex: 2,
            currentInstrumentId: 7,
            roundStartedAt: new Date(),
            deadlineAt: new Date(),
            players: new Map([
                [2, {
                    draftPattern: { steps: [true] },
                    locked: true,
                    ready: true
                }]
            ]),
            phase: "MATCH_RESULT"
        };
        const phaseStateMachine = {
            transition: jest.fn((currentRuntime, nextPhase) => {
                currentRuntime.phase = nextPhase;
            })
        };
        const coordinator = createNextMatchCoordinator({
            matchRepository: {
                createMatch: jest.fn().mockResolvedValue({
                    id: 11,
                    matchNumber: 2
                })
            },
            phaseStateMachine
        });

        const result = await coordinator.startNextMatch({
            runtime,
            maxMatchCount: 5
        });

        expect(result.started).toBe(true);
        expect(runtime.currentMatchId).toBe(11);
        expect(runtime.matchNumber).toBe(2);
        expect(runtime.matchResult).toBeNull();
        expect(runtime.playbackStartAt).toBeNull();
        expect(runtime.variantOrder).toEqual([]);
        expect(runtime.currentInstrumentIndex).toBe(0);
        expect(runtime.currentInstrumentId).toBeNull();
        expect(runtime.roundStartedAt).toBeNull();
        expect(runtime.deadlineAt).toBeNull();
        expect(runtime.players.get(2)).toEqual({
            draftPattern: null,
            locked: false,
            ready: false,
            reconnectCount: 0,
            reconnectDeadlineAt: null,
            roundSkipped: false
        });
        expect(phaseStateMachine.transition).toHaveBeenCalledWith(
            runtime,
            "MATCH_STARTING"
        );
    });

    test("son matchten sonra yeni match acmaz", async () => {
        const coordinator = createNextMatchCoordinator({
            matchRepository: {
                createMatch: jest.fn()
            },
            phaseStateMachine: {
                transition: jest.fn()
            }
        });

        const result = await coordinator.startNextMatch({
            runtime: {
                sessionId: 9,
                matchNumber: 5
            },
            maxMatchCount: 5
        });

        expect(result).toEqual({
            started: false,
            reason: "NO_MATCH_LEFT"
        });
    });
});

const {
    createInstrumentRoundManager
} = require("../src/game/instrument-round");
const {
    createPhaseStateMachine,
    GAME_PHASES
} = require("../src/game/phase.game-state.machine");

describe("InstrumentRoundManager", () => {
    function createTestRuntime() {
        return {
            sessionId: 1,
            matchNumber: 1,
            phase: GAME_PHASES.MATCH_STARTING,
            currentInstrumentIndex: 0,
            currentInstrumentId: null,
            roundStartedAt: null,
            deadlineAt: null,
            stateVersion: 0,
            sessionInstrumentIds: [3, 7],
            players: new Map([
                [10, {
                    playerId: 10,
                    draftPattern: { steps: [true] },
                    locked: true,
                    connected: false
                }],
                [11, {
                    playerId: 11,
                    draftPattern: { steps: [false] },
                    locked: true,
                    connected: true
                }]
            ])
        };
    }

    function createManager() {
        return createInstrumentRoundManager({
            phaseStateMachine: createPhaseStateMachine()
        });
    }

    test("ilk instrument roundunu baslatir", () => {
        const manager = createManager();
        const runtime = createTestRuntime();
        const now = new Date("2026-01-01T12:00:00.000Z");

        const updatedRuntime = manager.startRound({
            runtime,
            instrumentRoundSeconds: 30,
            now
        });

        expect(updatedRuntime.phase).toBe(GAME_PHASES.INSTRUMENT_ROUND);
        expect(updatedRuntime.currentInstrumentId).toBe(3);
        expect(updatedRuntime.roundStartedAt).toEqual(now);
        expect(updatedRuntime.deadlineAt).toEqual(
            new Date("2026-01-01T12:00:30.000Z")
        );
        expect(updatedRuntime.stateVersion).toBe(1);
    });

    test("oyuncu draft ve lock durumunu resetler, baglanti durumunu korur", () => {
        const manager = createManager();
        const runtime = createTestRuntime();

        manager.startRound({
            runtime,
            instrumentRoundSeconds: 30,
            now: new Date("2026-01-01T12:00:00.000Z")
        });

        expect(runtime.players.get(10)).toEqual({
            playerId: 10,
            draftPattern: null,
            locked: false,
            connected: false,
            ready: false,
            reconnectCount: 0,
            reconnectDeadlineAt: null,
            roundSkipped: false
        });

        expect(runtime.players.get(11)).toEqual({
            playerId: 11,
            draftPattern: null,
            locked: false,
            connected: true,
            ready: false,
            reconnectCount: 0,
            reconnectDeadlineAt: null,
            roundSkipped: false
        });
    });

    test("currentInstrumentIndex degerine gore instrument secer", () => {
        const manager = createManager();
        const runtime = createTestRuntime();
        runtime.currentInstrumentIndex = 1;

        manager.startRound({
            runtime,
            instrumentRoundSeconds: 10,
            now: new Date("2026-01-01T12:00:00.000Z")
        });

        expect(runtime.currentInstrumentId).toBe(7);
        expect(runtime.deadlineAt).toEqual(
            new Date("2026-01-01T12:00:10.000Z")
        );
    });

    test("sirasinda instrument yoksa hata firlatir", () => {
        const manager = createManager();
        const runtime = createTestRuntime();
        runtime.currentInstrumentIndex = 5;

        expect(() => {
            manager.startRound({
                runtime,
                instrumentRoundSeconds: 30,
                now: new Date("2026-01-01T12:00:00.000Z")
            });
        }).toThrow("gecersiz instrument");
    });
});

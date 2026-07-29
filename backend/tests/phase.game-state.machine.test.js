const {
    createPhaseStateMachine,
    GAME_PHASES
} = require("../src/game/phase.game-state.machine");

describe("PhaseStateMachine", () => {
    test("gecerli phase gecisini kabul eder", () => {
        const machine = createPhaseStateMachine();

        expect(
            machine.canTransition(
                GAME_PHASES.MATCH_STARTING,
                GAME_PHASES.INSTRUMENT_ROUND
            )
        ).toBe(true);
    });

    test("gecersiz phase gecisini reddeder", () => {
        const machine = createPhaseStateMachine();

        expect(
            machine.canTransition(
                GAME_PHASES.MATCH_STARTING,
                GAME_PHASES.VOTING
            )
        ).toBe(false);
    });

    test("bilinmeyen phase icin false doner", () => {
        const machine = createPhaseStateMachine();

        expect(machine.canTransition("UNKNOWN", GAME_PHASES.VOTING)).toBe(false);
        expect(machine.canTransition(GAME_PHASES.VOTING, "UNKNOWN")).toBe(false);
    });

    test("gecerli geciste runtime phase ve stateVersion guncellenir", () => {
        const machine = createPhaseStateMachine();
        const runtime = {
            phase: GAME_PHASES.MATCH_STARTING,
            stateVersion: 0
        };

        const updatedRuntime = machine.transition(
            runtime,
            GAME_PHASES.INSTRUMENT_ROUND
        );

        expect(updatedRuntime).toBe(runtime);
        expect(runtime.phase).toBe(GAME_PHASES.INSTRUMENT_ROUND);
        expect(runtime.stateVersion).toBe(1);
    });

    test("gecersiz geciste hata firlatir ve runtime degismez", () => {
        const machine = createPhaseStateMachine();
        const runtime = {
            phase: GAME_PHASES.MATCH_STARTING,
            stateVersion: 0
        };

        expect(() => {
            machine.transition(runtime, GAME_PHASES.VOTING);
        }).toThrow();

        expect(runtime.phase).toBe(GAME_PHASES.MATCH_STARTING);
        expect(runtime.stateVersion).toBe(0);
    });

    test("nextPhase verilmezse hata firlatir", () => {
        const machine = createPhaseStateMachine();
        const runtime = {
            phase: GAME_PHASES.MATCH_STARTING,
            stateVersion: 0
        };

        expect(() => {
            machine.transition(runtime);
        }).toThrow();
    });

    test("match resulttan OG rounda ve OG rounddan playbacke gecilebilir", () => {
        const machine = createPhaseStateMachine();

        expect(machine.canTransition("MATCH_RESULT", "OG_ROUND"))
            .toBe(true);
        expect(machine.canTransition("OG_ROUND", "PLAYBACK"))
            .toBe(true);
    });
});

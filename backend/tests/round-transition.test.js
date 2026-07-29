const {
    createRoundTransition
} = require("../src/game/round-transition");
const {
    createPhaseStateMachine,
    GAME_PHASES
} = require("../src/game/phase.game-state.machine");

describe("RoundTransition", () => {
    function createRuntime({ currentInstrumentIndex = 0 } = {}) {
        return {
            phase: GAME_PHASES.INSTRUMENT_ROUND,
            currentInstrumentIndex,
            currentInstrumentId: 7,
            sessionInstrumentIds: [7, 8, 9],
            stateVersion: 0
        };
    }

    function createTransition() {
        return createRoundTransition({
            phaseStateMachine: createPhaseStateMachine()
        });
    }

    test("sirada instrument varsa NEXT_INSTRUMENT phaseine gecer", () => {
        const transition = createTransition();
        const runtime = createRuntime({ currentInstrumentIndex: 0 });

        const updatedRuntime = transition.advanceAfterRound(runtime);

        expect(updatedRuntime).toBe(runtime);
        expect(runtime.phase).toBe(GAME_PHASES.NEXT_INSTRUMENT);
        expect(runtime.currentInstrumentIndex).toBe(1);
        expect(runtime.currentInstrumentId).toBeNull();
        expect(runtime.sessionInstrumentIds).toEqual([7, 8, 9]);
        expect(runtime.stateVersion).toBe(1);
    });

    test("son instrumenttan sonra MATCH_BUILDING phaseine gecer", () => {
        const transition = createTransition();
        const runtime = createRuntime({ currentInstrumentIndex: 2 });

        transition.advanceAfterRound(runtime);

        expect(runtime.phase).toBe(GAME_PHASES.MATCH_BUILDING);
        expect(runtime.currentInstrumentId).toBeNull();
        expect(runtime.currentInstrumentIndex).toBe(2);
        expect(runtime.sessionInstrumentIds).toEqual([7, 8, 9]);
        expect(runtime.stateVersion).toBe(1);
    });

    test("yanlis phasete round ilerletilemez", () => {
        const transition = createTransition();
        const runtime = createRuntime();
        runtime.phase = GAME_PHASES.MATCH_STARTING;

        expect(() => {
            transition.advanceAfterRound(runtime);
        }).toThrow("instrument roundunda degilsin");
    });
});

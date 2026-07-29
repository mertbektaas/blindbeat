const {
    createRoundCompletion
} = require("../src/game/round-completion");

describe("RoundCompletion", () => {
    function createRuntime({
        phase = "INSTRUMENT_ROUND",
        lockedStates = [true, true],
        deadlineAt = new Date("2026-01-01T12:00:30.000Z")
    } = {}) {
        return {
            phase,
            deadlineAt,
            players: new Map(
                lockedStates.map((locked, index) => [index + 1, {
                    playerId: index + 1,
                    locked
                }])
            )
        };
    }

    test("tum oyuncular lockladiysa true doner", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({ lockedStates: [true, true] });

        expect(completion.areAllPlayersLocked(runtime)).toBe(true);
    });

    test("bir oyuncu bile locklamadiysa false doner", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({ lockedStates: [true, false] });

        expect(completion.areAllPlayersLocked(runtime)).toBe(false);
    });

    test("bos oyuncu listesi locklanmis kabul edilmez", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({ lockedStates: [] });

        expect(completion.areAllPlayersLocked(runtime)).toBe(false);
    });

    test("deadline gelmeden false doner", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime();
        const now = new Date("2026-01-01T12:00:29.999Z");

        expect(completion.isDeadlineReached(runtime, now)).toBe(false);
    });

    test("deadline aninda true doner", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime();
        const now = new Date("2026-01-01T12:00:30.000Z");

        expect(completion.isDeadlineReached(runtime, now)).toBe(true);
    });

    test("deadline yoksa false doner", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({ deadlineAt: null });

        expect(completion.isDeadlineReached(runtime)).toBe(false);
    });

    test("herkes lockladiysa deadline beklemeden round biter", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({ lockedStates: [true, true] });
        const now = new Date("2026-01-01T12:00:10.000Z");

        expect(completion.shouldEndRound(runtime, now)).toBe(true);
    });

    test("deadline dolduysa herkes locklamasa da round biter", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({ lockedStates: [true, false] });
        const now = new Date("2026-01-01T12:00:30.000Z");

        expect(completion.shouldEndRound(runtime, now)).toBe(true);
    });

    test("yanlis phasete round bitmez", () => {
        const completion = createRoundCompletion();
        const runtime = createRuntime({
            phase: "MATCH_STARTING",
            lockedStates: [true, true]
        });

        expect(completion.shouldEndRound(runtime)).toBe(false);
    });
});

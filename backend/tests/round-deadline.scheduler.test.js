const {
    createRoundDeadlineScheduler
} = require("../src/game/round-deadline.scheduler");

function createRuntime({
    deadlineAt,
    phase = "INSTRUMENT_ROUND"
}) {
    return {
        sessionId: "session-1",
        currentMatchId: 7,
        phase,
        deadlineAt,
        currentInstrumentId: 12
    };
}

function createScheduler({ runtime, finalizeRound }) {
    const runtimeRegistry = {
        getAllRuntimes: jest.fn(() => [runtime])
    };

    const roundFinalizer = {
        finalizeRound: finalizeRound || jest.fn(async ({ runtime }) => ({
            completed: true,
            runtime
        }))
    };

    const instrumentRoundManager = {
        startRound: jest.fn()
    };

    const gameStateBroadcaster = {
        broadcastGameState: jest.fn()
    };

    const scheduler = createRoundDeadlineScheduler({
        runtimeRegistry,
        roundFinalizer,
        instrumentRoundManager,
        gameStateBroadcaster,
        gameConfig: {
            instrumentRoundSeconds: 30
        }
    });

    return {
        scheduler,
        roundFinalizer,
        instrumentRoundManager,
        gameStateBroadcaster
    };
}

describe("RoundDeadlineScheduler", () => {
    test("deadline gelmediyse roundu finalize etmez", async () => {
        const runtime = createRuntime({
            deadlineAt: new Date(Date.now() + 30_000)
        });
        const { scheduler, roundFinalizer } = createScheduler({ runtime });

        await scheduler.checkDeadlines();

        expect(roundFinalizer.finalizeRound).not.toHaveBeenCalled();
    });

    test("deadline dolduysa roundu finalize eder ve state yayinlar", async () => {
        const runtime = createRuntime({
            deadlineAt: new Date(Date.now() - 1_000)
        });
        const { scheduler, roundFinalizer, gameStateBroadcaster } =
            createScheduler({ runtime });

        await scheduler.checkDeadlines();

        expect(roundFinalizer.finalizeRound).toHaveBeenCalledWith({
            runtime,
            matchId: runtime.currentMatchId,
            now: expect.any(Date)
        });
        expect(gameStateBroadcaster.broadcastGameState)
            .toHaveBeenCalledWith(runtime.sessionId);
    });

    test("sonraki instrument varsa roundu baslatir", async () => {
        const runtime = createRuntime({
            deadlineAt: new Date(Date.now() - 1_000)
        });
        const resultRuntime = {
            ...runtime,
            phase: "NEXT_INSTRUMENT"
        };
        const finalizeRound = jest.fn(async () => ({
            completed: true,
            runtime: resultRuntime
        }));
        const {
            scheduler,
            instrumentRoundManager
        } = createScheduler({ runtime, finalizeRound });

        await scheduler.checkDeadlines();

        expect(instrumentRoundManager.startRound).toHaveBeenCalledWith({
            runtime,
            instrumentRoundSeconds: 30,
            now: expect.any(Date)
        });
    });

    test("ayni session icin ikinci finalize islemini paralel baslatmaz", async () => {
        const runtime = createRuntime({
            deadlineAt: new Date(Date.now() - 1_000)
        });
        let resolveFinalizer;
        const finalizeRound = jest.fn(() => new Promise((resolve) => {
            resolveFinalizer = resolve;
        }));
        const { scheduler, roundFinalizer } = createScheduler({
            runtime,
            finalizeRound
        });

        const firstCheck = scheduler.checkDeadlines();
        await Promise.resolve();
        const secondCheck = scheduler.checkDeadlines();

        expect(roundFinalizer.finalizeRound).toHaveBeenCalledTimes(1);

        resolveFinalizer({ completed: true, runtime });
        await Promise.all([firstCheck, secondCheck]);
    });

    test("start intervali baslatir ve stop intervali temizler", () => {
        jest.useFakeTimers();

        const runtime = createRuntime({
            deadlineAt: new Date(Date.now() + 30_000)
        });
        const { scheduler } = createScheduler({ runtime });

        scheduler.start();
        expect(jest.getTimerCount()).toBe(1);

        scheduler.stop();
        expect(jest.getTimerCount()).toBe(0);

        jest.useRealTimers();
    });
});

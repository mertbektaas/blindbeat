const {
    createRoundFinalizer
} = require("../src/game/round-finalizer");

describe("RoundFinalizer", () => {
    function createRuntime({
        phase = "INSTRUMENT_ROUND",
        players = [
            {
                playerId: 1,
                locked: false,
                draftPattern: null
            },
            {
                playerId: 2,
                locked: true,
                draftPattern: {
                    steps: [true, false]
                }
            }
        ]
    } = {}) {
        return {
            phase,
            currentInstrumentId: 10,
            stepCount: 8,
            players: new Map(
                players.map((player) => [player.playerId, player])
            )
        };
    }

    function createFinalizer({
        shouldEndRound = true,
        lockResults = [{ success: true }]
    } = {}) {
        const roundCompletion = {
            shouldEndRound: jest.fn(() => shouldEndRound)
        };
        const patternLockManager = {
            lockPattern: jest.fn()
        };
        const roundTransition = {
            advanceAfterRound: jest.fn()
        };
        const createEmptyPattern = jest.fn(() => ({
            steps: [false, false]
        }));
        const instrumentRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 10,
                code: "drums"
            })
        };

        lockResults.forEach((result) => {
            patternLockManager.lockPattern.mockResolvedValueOnce(result);
        });

        const finalizer = createRoundFinalizer({
            roundCompletion,
            patternLockManager,
            roundTransition,
            createEmptyPattern,
            instrumentRepository
        });

        return {
            finalizer,
            roundCompletion,
            patternLockManager,
            roundTransition,
            createEmptyPattern,
            instrumentRepository
        };
    }

    test("round bitmediyse pattern kilitlemez ve phase ilerletmez", async () => {
        const {
            finalizer,
            patternLockManager,
            roundTransition
        } = createFinalizer({ shouldEndRound: false });
        const runtime = createRuntime();

        const result = await finalizer.finalizeRound({
            runtime,
            matchId: 5,
            now: new Date()
        });

        expect(result.completed).toBe(false);
        expect(patternLockManager.lockPattern).not.toHaveBeenCalled();
        expect(roundTransition.advanceAfterRound).not.toHaveBeenCalled();
    });

    test("kilitlenmemis oyuncunun bos patternini olusturup kilitler", async () => {
        const {
            finalizer,
            patternLockManager,
            roundTransition,
            createEmptyPattern,
            instrumentRepository
        } = createFinalizer();
        const runtime = createRuntime();

        const result = await finalizer.finalizeRound({
            runtime,
            matchId: 5,
            now: new Date()
        });

        expect(result.completed).toBe(true);
        expect(instrumentRepository.findById).toHaveBeenCalledWith(10);
        expect(createEmptyPattern).toHaveBeenCalledWith({
            instrumentCode: "drums",
            instrumentCategory: undefined,
            stepCount: 8
        });
        expect(patternLockManager.lockPattern).toHaveBeenCalledWith({
            runtime,
            playerId: 1,
            matchId: 5
        });
        expect(roundTransition.advanceAfterRound).toHaveBeenCalledWith(runtime);
        expect(runtime.players.get(1).draftPattern).toEqual({
            steps: [false, false]
        });
    });

    test("kilitleme basarisizsa round ilerletilmez", async () => {
        const {
            finalizer,
            patternLockManager,
            roundTransition
        } = createFinalizer({
            lockResults: [{
                success: false,
                error: "pattern kaydedilemedi"
            }]
        });
        const runtime = createRuntime();

        const result = await finalizer.finalizeRound({
            runtime,
            matchId: 5,
            now: new Date()
        });

        expect(result.completed).toBe(false);
        expect(patternLockManager.lockPattern).toHaveBeenCalledTimes(1);
        expect(roundTransition.advanceAfterRound).not.toHaveBeenCalled();
    });

    test("tum oyuncular zaten kilitliyse result beklemeden round ilerler", async () => {
        const {
            finalizer,
            patternLockManager,
            roundTransition
        } = createFinalizer();
        const runtime = createRuntime({
            players: [
                {
                    playerId: 1,
                    locked: true,
                    draftPattern: {
                        steps: [true, false]
                    }
                }
            ]
        });

        const result = await finalizer.finalizeRound({
            runtime,
            matchId: 5,
            now: new Date()
        });

        expect(result.completed).toBe(true);
        expect(patternLockManager.lockPattern).not.toHaveBeenCalled();
        expect(roundTransition.advanceAfterRound).toHaveBeenCalledWith(runtime);
    });
});

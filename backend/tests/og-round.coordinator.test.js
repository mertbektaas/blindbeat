const {
    createOgRoundCoordinator
} = require("../src/services/og-round.coordinator");

describe("OG Round coordinator", () => {
    test("archive adaylarini yeni matchte playbacke tasir", async () => {
        const runtime = {
            phase: "MATCH_RESULT",
            currentMatchId: 10,
            matchNumber: 5,
            ogRoundNumber: 0,
            usedOgPatternIds: new Set(),
            matchResult: { winnerVariantIds: [1] }
        };
        const runtimeRegistry = {
            getRuntime: jest.fn().mockReturnValue(runtime)
        };
        const ogRoundService = {
            prepareRound: jest.fn().mockResolvedValue({
                started: true,
                tiedPlayerIds: [2, 4],
                patternIds: [101, 102],
                candidates: [
                    { playerId: 2, patterns: [{ id: 101 }] },
                    { playerId: 4, patterns: [{ id: 102 }] }
                ]
            })
        };
        const matchRepository = {
            createMatch: jest.fn().mockResolvedValue({
                id: 20,
                sessionId: 9,
                matchNumber: 6
            }),
            deleteMatch: jest.fn()
        };
        const songAssemblyService = {
            buildOgRoundSongVariants: jest.fn().mockResolvedValue({
                success: true,
                variants: [
                    { variantNo: 1 },
                    { variantNo: 2 }
                ]
            })
        };
        const phaseStateMachine = {
            transition: jest.fn((currentRuntime, nextPhase) => {
                currentRuntime.phase = nextPhase;
            })
        };
        const playbackPhaseManager = {
            enterPlayback: jest.fn((args) => {
                args.runtime.phase = "PLAYBACK";
            })
        };

        const coordinator = createOgRoundCoordinator({
            runtimeRegistry,
            phaseStateMachine,
            ogRoundService,
            matchRepository,
            songAssemblyService,
            playbackPhaseManager
        });

        const result = await coordinator.startRound({
            sessionId: 9,
            maxMatchCount: 5,
            instrumentIds: [10],
            playerIds: [2, 4]
        });

        expect(result.started).toBe(true);
        expect(result.matchNumber).toBe(6);
        expect(runtime.currentMatchId).toBe(20);
        expect(runtime.ogRoundNumber).toBe(1);
        expect([...runtime.usedOgPatternIds]).toEqual([101, 102]);
        expect(phaseStateMachine.transition).toHaveBeenCalledWith(
            runtime,
            "OG_ROUND"
        );
        expect(playbackPhaseManager.enterPlayback).toHaveBeenCalledWith({
            runtime,
            variants: [
                { variantNo: 1 },
                { variantNo: 2 }
            ]
        });
    });
});

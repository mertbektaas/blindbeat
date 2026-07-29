const {
    createSessionResultService
} = require("../src/services/session-result.service");

describe("SessionResultService", () => {
    test("sessioni kapatir, lobbyyi acip madalya sonucunu runtimea yazar", async () => {
        const runtime = {
            phase: "MATCH_RESULT"
        };
        const prisma = {
            session: {
                update: jest.fn().mockResolvedValue({
                    lobbyId: 40
                })
            },
            lobby: {
                update: jest.fn().mockResolvedValue({})
            }
        };
        const phaseStateMachine = {
            transition: jest.fn((currentRuntime, nextPhase) => {
                currentRuntime.phase = nextPhase;
            })
        };
        const service = createSessionResultService({
            prisma,
            runtimeRegistry: {
                getRuntime: jest.fn().mockReturnValue(runtime)
            },
            phaseStateMachine,
            sessionLeaderboardRepository: {
                findBySessionId: jest.fn().mockResolvedValue([
                    { playerId: 2, totalScore: 8 },
                    { playerId: 4, totalScore: 5 }
                ])
            }
        });

        const result = await service.completeSession({
            sessionId: 9
        });

        expect(prisma.session.update).toHaveBeenCalledWith({
            where: { id: 9 },
            data: { status: "COMPLETED" },
            select: { lobbyId: true }
        });
        expect(prisma.lobby.update).toHaveBeenCalledWith({
            where: { id: 40 },
            data: { status: "OPEN" }
        });
        expect(phaseStateMachine.transition).toHaveBeenCalledWith(
            runtime,
            "SESSION_COMPLETED"
        );
        expect(runtime.sessionResult.medals[0]).toEqual({
            playerId: 2,
            medal: "GOLD",
            totalScore: 8
        });
        expect(result.success).toBe(true);
    });
});

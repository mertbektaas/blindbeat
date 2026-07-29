const { LobbyStatus, SessionStatus } = require("@prisma/client");
const {
    createSessionResult
} = require("../game/session-result");

function createSessionResultService({
    prisma,
    runtimeRegistry,
    phaseStateMachine,
    sessionLeaderboardRepository
}) {
    async function completeSession({ sessionId }) {
        const entries = await sessionLeaderboardRepository.findBySessionId(
            sessionId
        );
        const result = createSessionResult({
            leaderboard: entries
        });

        const session = await prisma.session.update({
            where: {
                id: sessionId
            },
            data: {
                status: SessionStatus.COMPLETED
            },
            select: {
                lobbyId: true
            }
        });

        await prisma.lobby.update({
            where: {
                id: session.lobbyId
            },
            data: {
                status: LobbyStatus.OPEN
            }
        });

        const runtime = runtimeRegistry.getRuntime(sessionId);
        phaseStateMachine.transition(runtime, "SESSION_COMPLETED");
        runtime.sessionResult = result;

        return {
            success: true,
            sessionId,
            ...result
        };
    }

    return {
        completeSession
    };
}

module.exports = {
    createSessionResultService
};

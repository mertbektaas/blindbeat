const { LobbyStatus, SessionStatus } = require("@prisma/client");

const { createLobbyRepository } = require("../repositories/lobby.repository");

const { createInstrumentRepository } = require("../repositories/instrument.repository");

const { createSessionRepository } = require("../repositories/session.repository");

const { createSessionInstrumentRepository } = require("../repositories/session-instrument.repository");

const { createSessionPlayerRepository } = require("../repositories/session-player.repository");

const { createSessionLeaderboardRepository } = require("../repositories/session-leaderboard.repository");

const gameConfig = require("../config/game.config");


const {
    lobbyNotFound,
    identityNotFound,
    lobbyLocked,
    minPlayersNotReached,
    invalidSessionConfig,
    instrumentNotAvailable,
} = require("../errors/domain.errors");

const {
    validateStartSession
} = require("../validation/session.schemas");

function createSessionService({
    prisma,
    identityRegistry
}) {
    return {
        async startSession({
            lobbyCode,
            identity,
            config
        }) {

            const validation = validateStartSession(config);
            
            if(!validation.valid) { throw invalidSessionConfig(); }

            const sessionConfig = validation.data;

            const result = await prisma.$transaction( async (tx) => {
                const lobbyRepository = createLobbyRepository(tx);
                const instrumentRepository = createInstrumentRepository(tx);
                const sessionRepository = createSessionRepository(tx);
                const sessionInstrumentRepository = createSessionInstrumentRepository(tx);
                const sessionPlayerRepository = createSessionPlayerRepository(tx);
                const sessionLeaderboardRepository = createSessionLeaderboardRepository(tx);

                // const playerRepository = createPlayerRepository(tx);

                const lobby = await lobbyRepository.findByCodeWithPlayers(lobbyCode);
                const instruments = [];


                if(!lobby) { throw lobbyNotFound()}

                if(!identity ||
                    identity.lobbyId !== lobby.id ||
                    !lobby.players.some(player => player.id === identity.playerId)
                ) { throw identityNotFound() }

                if(lobby.status !== LobbyStatus.OPEN) {throw lobbyLocked()}

                if(lobby.players.length < gameConfig.minPlayers) { throw minPlayersNotReached(lobby.players.length, gameConfig.minPlayers)}

                for (const code of sessionConfig.instrumentCodes) {
                    const instrument = await instrumentRepository.findByCode(code);

                    if(!instrument || !instrument.enabled) {throw instrumentNotAvailable(code)}

                    instruments.push(instrument);
                }
                
                const sessionInstruments = instruments.map((instrument, index) => ({
                    instrumentId: instrument.id,
                    orderNo: index+1
                }));

                const updatedLobby = await lobbyRepository.updateStatus(
                    lobby.id, 
                    LobbyStatus.IN_SESSION
                );

                const session = await sessionRepository.createSession({
                    lobbyId: lobby.id,
                    maxMatchCount: sessionConfig.maxMatchCount,
                    bpm: sessionConfig.bpm,
                    stepCount:sessionConfig.stepCount,
                    instrumentRoundSeconds:sessionConfig.instrumentRoundSeconds,
                    playbackLoops:sessionConfig.playbackLoops,
                    songVariantCount:sessionConfig.songVariantCount,
                    status: SessionStatus.RUNNING
                });

                const playerIDs = lobby.players.map(player => player.id);


                await sessionInstrumentRepository.createMany({
                    sessionId: session.id,
                    instruments: sessionInstruments
                });

                await sessionPlayerRepository.createMany({
                    sessionId: session.id,
                    playerIds : playerIDs
                });

                await sessionLeaderboardRepository.createMany({
                    sessionId: session.id,
                    playerIds: playerIDs
                });
                             
                return { lobby: updatedLobby,
                         config: sessionConfig,
                         instruments,
                         sessionInstruments,
                         session
                }
            })

            return result;
        }
    };
}

module.exports = {
    createSessionService
};
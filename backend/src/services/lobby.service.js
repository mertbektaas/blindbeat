const { LobbyStatus } = require("@prisma/client");
const {
    createLobbyRepository
} = require("../repositories/lobby.repository");
const {
    createPlayerRepository
} = require("../repositories/player.repository");
const {
    generateLobbyCode: defaultGenerateLobbyCode
} = require("../utils/lobby-code");
const gameConfig = require("../config/game.config");

const {
    lobbyNotFound,
    lobbyLocked,
    lobbyFull,
    nicknameTaken,
    mapPrismaError,
    identityNotFound
} = require("../errors/domain.errors");

function createLobbyService({
    prisma,
    identityRegistry,
    generateLobbyCode = defaultGenerateLobbyCode
}) {
    // Eski lobbyId -> yeni lobbyCode eslesmesi. Ayni eski lobiden
    // gelen oyuncular hep ayni yeni lobiye yonlendirilir.
    const lobbyRotations = new Map();

    return {
        async createLobby({ nickname }) {
            const lobbyCode = generateLobbyCode();

            const result = await prisma.$transaction(async (tx) => {
                const lobbyRepository = createLobbyRepository(tx);
                const playerRepository = createPlayerRepository(tx);

                // 1. OPEN statuslu lobby oluştur
                const lobby = await lobbyRepository.createLobby(
                    lobbyCode,
                    LobbyStatus.OPEN
                );
                // 2. lobby.id ile player oluştur
                const player = await playerRepository.createPlayer({
                    nickname: nickname,
                    lobbyId: lobby.id
                });

                const updatedLobby = await lobbyRepository.findByCodeWithPlayers(lobbyCode);
                // 3. lobby ve player döndür
                return {
                    lobby: updatedLobby,
                    player
                };
            });

            const { lobby, player} = result;

            const identity = identityRegistry.create({
                    playerId: player.id,
                    lobbyId: lobby.id,
                    nickname: player.nickname
                })

            return {
                lobby,
                player,
                identity
            };
        },
         async joinLobby({
            lobbyCode,
            nickname,
            existingIdentity = null
        }) {
            
            let result;

            try{
                result = await prisma.$transaction(async (tx) => {

                const lobbyRepository =  createLobbyRepository(tx);
                const playerRepository =  createPlayerRepository(tx);

                const lobby = await lobbyRepository.findByCodeWithPlayers(lobbyCode);
                
                if(!lobby){
                    throw lobbyNotFound();
                }

                const reconnectingPlayer = (
                    existingIdentity?.lobbyId === lobby.id
                )
                    ? lobby.players.find(
                        player => player.id === existingIdentity.playerId
                    )
                    : null;

                if (reconnectingPlayer) {
                    return {
                        lobby,
                        player: reconnectingPlayer,
                        reconnected: true
                    };
                }

                if(lobby.status !== LobbyStatus.OPEN){
                    throw lobbyLocked();
                }

                if(lobby.players.length >= gameConfig.maxPlayers){
                    throw lobbyFull();
                }

                const existingPlayer = await playerRepository.findByLobbyAndNickname({lobbyId: lobby.id, nickname: nickname});

                if(existingPlayer){
                    throw nicknameTaken();
                } 
                
                const player = await playerRepository.createPlayer({
                    nickname: nickname,
                    lobbyId: lobby.id
                })

                const updatedLobby = await lobbyRepository.findByCodeWithPlayers(lobbyCode);

                return {
                    lobby: updatedLobby,
                    player,
                    reconnected: false
                };
            })
            }

            catch (error) {
                throw mapPrismaError(error);
            }

            const { lobby, player} = result;

            if (result.reconnected) {
                return result;
            }

            const identity = identityRegistry.create({
                    playerId: player.id,
                    lobbyId: lobby.id,
                    nickname: player.nickname
                })

            return {
                lobby,
                player,
                identity,
                reconnected: false
            };
        },
        async leaveLobby({
            lobbyCode,
            identity,
            token
        }) {
            let result;

            result = await prisma.$transaction(async (tx) => {
                const lobbyRepository = createLobbyRepository(tx);
                const playerRepository = createPlayerRepository(tx);

                const lobby = await lobbyRepository.findByCodeWithPlayers(lobbyCode);

                if(!lobby){
                    throw lobbyNotFound();
                }

                if(!identity ||
                    identity.lobbyId !== lobby.id ||
                    !lobby.players.some(player => player.id === identity.playerId)
                ){
                    throw identityNotFound();
                }

                if(lobby.status !== LobbyStatus.OPEN){
                    throw lobbyLocked();
                }


                const lobbyWillBeDeleted = lobby.players.length === 1;

                await playerRepository.deleteById(identity.playerId);

                if (lobbyWillBeDeleted) {
                    await lobbyRepository.deleteById(lobby.id);

                    return {
                        lobby: null,
                        lobbyDeleted: true
                    };
                }

                const updatedLobby =
                    await lobbyRepository.findByCodeWithPlayers(lobbyCode);

                return {
                    lobby: updatedLobby,
                    lobbyDeleted: false
                };
            })

            await identityRegistry.delete(token);

            return result;
        },
        // SESSION_RESULT ekranindan lobiye donus akisi. Eski lobby
        // CLOSED duruma getirilir, oyuncu icin yeni bir lobby olusturulur
        // ve oyuncu oraya eklenir. Ayni eski lobiden donen diger
        // oyuncular da ayni yeni lobiye yonlendirilir (lobbyRotations
        // Map ile takip edilir).
        async rotateLobby({
            oldLobbyId,
            playerId,
            nickname
        }) {
            // Ayni eski lobiden daha once donus yapildiysa, o lobiye
            // katil. Aksi halde yeni bir lobi olustur ve eslesmeyi kaydet.
            if (lobbyRotations.has(oldLobbyId)) {
                const existingLobbyCode = lobbyRotations.get(oldLobbyId);
                return await this.joinLobby({
                    lobbyCode: existingLobbyCode,
                    nickname
                });
            }

            const newLobbyCode = generateLobbyCode();

            const result = await prisma.$transaction(async (tx) => {
                const lobbyRepository = createLobbyRepository(tx);
                const playerRepository = createPlayerRepository(tx);

                // Eski lobby'yi CLOSED yap (yeni oyuncu kabul etmesin)
                await lobbyRepository.updateStatus(oldLobbyId, LobbyStatus.CLOSED);

                // Yeni lobby olustur
                const newLobby = await lobbyRepository.createLobby(
                    newLobbyCode,
                    LobbyStatus.OPEN
                );

                // Oyuncuyu yeni lobiye ekle
                const newPlayer = await playerRepository.createPlayer({
                    nickname: nickname,
                    lobbyId: newLobby.id
                });

                const updatedLobby = await lobbyRepository.findByCodeWithPlayers(
                    newLobbyCode
                );

                return {
                    lobby: updatedLobby,
                    player: newPlayer
                };
            });

            lobbyRotations.set(oldLobbyId, newLobbyCode);

            const { lobby, player } = result;

            const identity = identityRegistry.create({
                playerId: player.id,
                lobbyId: lobby.id,
                nickname: player.nickname
            });

            return {
                lobby,
                player,
                identity
            };
        }
            };
}

module.exports = {
    createLobbyService
};

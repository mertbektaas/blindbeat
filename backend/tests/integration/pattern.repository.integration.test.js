const { PatternPoolStatus } = require("@prisma/client");
const {
    prisma,
    disconnectDatabase
} = require("../../src/database");

const {
    createPatternRepository
} = require("../../src/repositories/pattern.repository");

let repository;
let lobbyId;
let playerId;
let matchId;
let instrumentId;
let savedPatternId;
let playerNickname;

beforeAll(async () => {

    playerNickname = `tester-${Date.now()}`;

    const lobby = await prisma.lobby.create({
        data: {
            code: `integration-${Date.now()}`
        }
    });

    lobbyId = lobby.id;

    const player = await prisma.player.create({
        data: {
            nickname: playerNickname,
            lobbyId: lobby.id
        }
    });

    playerId = player.id;

    const session = await prisma.session.create({
        data: {
            lobbyId: lobby.id
        }
    });

    await prisma.sessionPlayer.create({
        data: {
            sessionId: session.id,
            playerId: player.id
        }
    });

    const match = await prisma.match.create({
        data: {
            sessionId: session.id,
            matchNumber: 1
        }
    });

    matchId = match.id;

    const instrument = await prisma.instrument.findUnique({
        where: {
            code: "bass"
        }
    });

    instrumentId = instrument.id;

    repository = createPatternRepository(prisma);
});

afterAll(async () => {
    await prisma.lobby.delete({
        where: {
            id: lobbyId
        }
    });

    await disconnectDatabase();
});

test("patterni gerçek PostgreSQL'e kaydeder ve duplicate patterni reddeder", async () => {
    const patternData = {
        version: 1,
        instrumentType: "bass",
        stepCount: 3,
        data: {
            steps: [
                null,
                {note: "C3", velocity: 0.79},
                null
            ]
        }
    };

    const patternDataSecond = {
        version: 1,
        instrumentType: "bass",
        stepCount: 3,
        data: {
            steps: [
                null,
                {note: "C4", velocity: 0.43},
                null
            ]
        }
    };

    const savedPattern = await repository.createPattern({
        playerId: playerId,
        matchId: matchId,
        instrumentId: instrumentId,
        patternData
    });

    savedPatternId= savedPattern.id;

    await expect(
    repository.createPattern({
        playerId,
        matchId,
        instrumentId,
        patternData: patternDataSecond
    })
    ).rejects.toMatchObject({
        code: "P2002"
    });



    expect(savedPattern.id).toBeDefined();
    expect(savedPattern.playerId).toBe(playerId);
    expect(savedPattern.matchId).toBe(matchId);
    expect(savedPattern.instrumentId).toBe(instrumentId);

    const storedPattern = await prisma.pattern.findUnique({
        where: {
            id: savedPattern.id
        }
    });

    expect(storedPattern.patternData).toEqual(patternData);
});

test("aktif patternleri instrumentlere gore getirir", async () =>{

    const activePatterns = await repository.findActiveByInstrument(instrumentId);

    const foundPattern = activePatterns.find(
        pattern => pattern.id === savedPatternId
    );

    expect(foundPattern).toBeDefined();
    expect(foundPattern.instrumentId).toBe(instrumentId);
    expect(foundPattern.poolStatus).toBe(PatternPoolStatus.ACTIVE);

});

test("patternin havuz durumunu archive yapar", async () => {
    const updatedPattern = await repository.updatePoolStatus(
        savedPatternId,
        PatternPoolStatus.ARCHIVE
    );

    expect(updatedPattern.poolStatus).toBe(PatternPoolStatus.ARCHIVE);

    const storedPattern = await prisma.pattern.findUnique({
        where: {
            id: savedPatternId
        }
    });

    expect(storedPattern.poolStatus).toBe(PatternPoolStatus.ARCHIVE);
});

test("ayni lobby icinde duplicate nickname reddedilir", async () => {
    await expect(
        prisma.player.create({
            data:{
                nickname: playerNickname,
                lobbyId: lobbyId
            }     
        })
    ).rejects.toMatchObject({
        code: "P2002"
    });
});

test("player lobby iliskisini dondurur", async() => {
    const playerWithLobby = await prisma.player.findUnique({
        where:{
            id: playerId
        },
        include: {
            lobby:true
        }
    });

    expect(playerWithLobby).toBeDefined();
    expect(playerWithLobby.lobby).toBeDefined();
    expect(playerWithLobby.lobby.id).toBe(lobbyId);
});
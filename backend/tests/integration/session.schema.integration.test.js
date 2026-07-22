const { SessionStatus, LobbyStatus } = require("@prisma/client");
const {
    prisma,
    disconnectDatabase
} = require("../../src/database");
const { createInstrumentRepository } = require("../../src/repositories/instrument.repository");


let lobbyId;
let sessionId;
let kickId;
let bassId;

const repository = createInstrumentRepository(prisma);

beforeAll(async () => {
    
    const lobby = await prisma.lobby.create({
        data: {
            code: `session-test-${Date.now()}`,
            status: LobbyStatus.OPEN
        }
    })

    lobbyId = lobby.id;
    
    const kick = await repository.findByCode("kick");

    const bass = await repository.findByCode("bass");
    
    const session = await prisma.session.create({
        data: {
            lobbyId: lobbyId,
            bpm: 120,
            stepCount: 8,
            instrumentRoundSeconds: 30,
            playbackLoops: 5,
            songVariantCount: 3,
            maxMatchCount: 5,
            status: SessionStatus.RUNNING
        }
    })
    
    sessionId = session.id;


    await prisma.sessionInstrument.createMany({
        data: [
            {
                sessionId,
                instrumentId: kick.id,
                orderNo: 1
            },
            {
                sessionId,
                instrumentId: bass.id,
                orderNo: 2
            }
        ]
    });

    kickId = kick.id;
    bassId = bass.id;
});

afterAll(async () => {
    await prisma.lobby.delete({
        where: {
            id: lobbyId
        }
    });

    await disconnectDatabase();
});

test("session snapshot ve instrument sirasi geri okunur", async () => {
    const session = await prisma.session.findUnique({
        where: {
            id: sessionId
        },
        include: {
            sessionInstruments: {
                include: {
                    instrument: true
                },
                orderBy: {
                    orderNo: "asc"
                }
            }
        }
    });

    expect(session.id).toEqual(sessionId);
    expect(session.bpm).toEqual(120);
    expect(session.stepCount).toEqual(8);
    expect(session.sessionInstruments.length).toEqual(2);
    expect(session.sessionInstruments[0].instrumentId).toEqual(kickId);
    expect(session.sessionInstruments[1].instrumentId).toEqual(bassId);
    expect(session.status).toBe(SessionStatus.RUNNING);
    expect(session.maxMatchCount).toBe(5);
    expect(session.instrumentRoundSeconds).toBe(30);
    expect(session.playbackLoops).toBe(5);
    expect(session.songVariantCount).toBe(3);
    expect(session.sessionInstruments[0].orderNo).toBe(1);
    expect(session.sessionInstruments[1].orderNo).toBe(2);
    expect(session.sessionInstruments[0].instrument.code).toBe("kick");
    expect(session.sessionInstruments[1].instrument.code).toBe("bass");
    
});

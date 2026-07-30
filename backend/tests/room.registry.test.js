const {
    createRoomRegistry
} = require("../src/realtime/room.registry");

describe("RoomRegistry lobby state", () => {
    test("kurucuyu host yapar ve oyunculara ortak başlangıç patterni verir", () => {
        const registry = createRoomRegistry();

        registry.initializeLobby({
            lobbyId: 16,
            lobbyCode: "ABCD",
            hostPlayerId: 24
        });

        const room = registry.ensureLobbyState({
            lobbyId: 16,
            lobbyCode: "ABCD",
            players: [
                { id: 24, nickname: "Mert" },
                { id: 25, nickname: "Ada" }
            ]
        });

        expect(room.hostPlayerId).toBe(24);
        expect(room.lobbyConfig.stepCount).toBe(16);
        expect(room.lobbyPatterns[24]).toHaveLength(16);
        expect(room.lobbyPatterns[25]).toHaveLength(16);
    });

    test("step sayısı değişince bütün patternleri aynı uzunluğa getirir", () => {
        const registry = createRoomRegistry();
        const room = registry.getOrCreateRoom(16, "ABCD");

        room.lobbyPatterns[24] = [true, false, true];
        room.lobbyPatterns[25] = [false, true];

        registry.updateLobbyConfig({
            lobbyId: 16,
            config: { stepCount: 8 }
        });

        expect(room.lobbyPatterns[24]).toEqual([
            true, false, true, false, false, false, false, false
        ]);
        expect(room.lobbyPatterns[25]).toEqual([
            false, true, false, false, false, false, false, false
        ]);
    });

    test("bilinçli olarak ayrılan oyuncunun patternini siler ve hostluğu devreder", () => {
        const registry = createRoomRegistry();
        const room = registry.initializeLobby({
            lobbyId: 16,
            lobbyCode: "ABCD",
            hostPlayerId: 24
        });

        room.lobbyPatterns[24] = [true, false];
        room.lobbyPatterns[25] = [false, true];

        registry.removeLobbyPlayerState({
            lobbyId: 16,
            playerId: 24,
            nextHostPlayerId: 25
        });

        expect(room.lobbyPatterns[24]).toBeUndefined();
        expect(room.lobbyPatterns[25]).toEqual([false, true]);
        expect(room.hostPlayerId).toBe(25);
    });
});

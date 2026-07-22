const {
    createRoomRegistry
} = require("../src/realtime/room.registry");

describe("RoomRegistry", () => {
    test("yeni room oluşturur ve aynı roomu tekrar döndürür", () => {
        const registry = createRoomRegistry();

        const firstRoom = registry.getOrCreateRoom(16, "ABCD");
        const secondRoom = registry.getOrCreateRoom(16, "ABCD");

        expect(firstRoom).toBe(secondRoom);
        expect(firstRoom.lobbyId).toBe(16);
        expect(firstRoom.lobbyCode).toBe("ABCD");
        expect(firstRoom.onlinePlayerIds.size).toBe(0);
    });

    test("oyuncuyu rooma ekler ve duplicate oyuncu oluşturmaz", () => {
        const registry = createRoomRegistry();

        const room = registry.addPlayer(16, "ABCD", 24);
        registry.addPlayer(16, "ABCD", 24);

        expect(room.onlinePlayerIds.has(24)).toBe(true);
        expect(room.onlinePlayerIds.size).toBe(1);
    });

    test("roomdaki oyuncuyu kaldırır", () => {
        const registry = createRoomRegistry();

        registry.addPlayer(16, "ABCD", 24);
        registry.addPlayer(16, "ABCD", 25);

        const room = registry.removePlayer(16, 24);

        expect(room.onlinePlayerIds.has(24)).toBe(false);
        expect(room.onlinePlayerIds.has(25)).toBe(true);
    });

    test("olmayan roomdan oyuncu kaldırılırsa undefined döner", () => {
        const registry = createRoomRegistry();

        expect(registry.removePlayer(99, 24)).toBeUndefined();
    });

    test("roomu tamamen siler", () => {
        const registry = createRoomRegistry();

        registry.getOrCreateRoom(16, "ABCD");
        registry.deleteRoom(16);

        expect(registry.getRoom(16)).toBeUndefined();
    });
});

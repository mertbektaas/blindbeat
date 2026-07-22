const {
    createConnectionRegistry
} = require("../src/realtime/connection.registry");

describe("ConnectionRegistry", () => {
    test("oyuncunun socketini kaydeder ve geri getirir", () => {
        const registry = createConnectionRegistry();
        const socket = {};

        const previousSocket = registry.add(24, socket);

        expect(previousSocket).toBeUndefined();
        expect(registry.getSocketByPlayerId(24)).toBe(socket);
    });

    test("aynı oyuncu yeniden bağlanınca eski socketi döndürür", () => {
        const registry = createConnectionRegistry();
        const oldSocket = {};
        const newSocket = {};

        registry.add(24, oldSocket);
        const previousSocket = registry.add(24, newSocket);

        expect(previousSocket).toBe(oldSocket);
        expect(registry.getSocketByPlayerId(24)).toBe(newSocket);
    });

    test("socket kaldırılınca oyuncu eşleşmesi de kaldırılır", () => {
        const registry = createConnectionRegistry();
        const socket = {};

        registry.add(24, socket);
        const removedPlayerId = registry.removeBySocket(socket);

        expect(removedPlayerId).toBe(24);
        expect(registry.getSocketByPlayerId(24)).toBeUndefined();
        expect(registry.removeBySocket(socket)).toBeUndefined();
    });

    test("kayıtlı olmayan socket için undefined döner", () => {
        const registry = createConnectionRegistry();
        const unknownSocket = {};

        expect(registry.removeBySocket(unknownSocket)).toBeUndefined();
    });
});

const {
    createPlayerIdentityRegistry
} = require("../src/registries/player-identity.registry");

describe("PlayerIdentityRegistry", () => {
    test("identity icin token uretir ve identityyi saklar", () => {
        const registry = createPlayerIdentityRegistry();

        const result = registry.create({
            playerId: 5,
            lobbyId: 2,
            nickname: "Mert"
        });

        expect(result.token).toEqual(expect.any(String));
        expect(result.token).toHaveLength(64);
        expect(result.identity.playerId).toBe(5);
        expect(result.identity.lobbyId).toBe(2);
        expect(result.identity.nickname).toBe("Mert");
        expect(result.identity.createdAt).toBeInstanceOf(Date);
        expect(result.identity.lastSeenAt).toBeInstanceOf(Date);
    });

    test("token ile identity geri okunur", () => {
        const registry = createPlayerIdentityRegistry();
        const created = registry.create({
            playerId: 5,
            lobbyId: 2,
            nickname: "Mert"
        });

        const result = registry.get(created.token);

        expect(result).toBe(created.identity);
    });

    test("bilinmeyen token icin null doner", () => {
        const registry = createPlayerIdentityRegistry();

        expect(registry.get("bilinmeyen-token")).toBeNull();
    });

    test("token ile identity silinir", () => {
        const registry = createPlayerIdentityRegistry();
        const created = registry.create({
            playerId: 5,
            lobbyId: 2,
            nickname: "Mert"
        });

        const deleted = registry.delete(created.token);

        expect(deleted).toBe(true);
        expect(registry.get(created.token)).toBeNull();
    });

    test("registry temizlenir", () => {
        const registry = createPlayerIdentityRegistry();
        const created = registry.create({
            playerId: 5,
            lobbyId: 2,
            nickname: "Mert"
        });

        registry.clear();

        expect(registry.get(created.token)).toBeNull();
    });
});

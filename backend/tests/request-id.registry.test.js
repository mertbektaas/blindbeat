const {
    createRequestIdRegistry
} = require("../src/realtime/request-id.registry");

describe("RequestIdRegistry", () => {
    test("ayni oyuncunun ayni requestIdsi ikinci kez kabul edilmez", () => {
        const registry = createRequestIdRegistry();

        expect(registry.claim({
            playerId: 7,
            requestId: "req-1"
        })).toEqual({
            tracked: true,
            duplicate: false
        });

        expect(registry.claim({
            playerId: 7,
            requestId: "req-1"
        })).toEqual({
            tracked: true,
            duplicate: true
        });
    });

    test("farkli oyuncular ayni requestIdyi kullanabilir", () => {
        const registry = createRequestIdRegistry();

        expect(registry.claim({
            playerId: 7,
            requestId: "same-id"
        }).duplicate).toBe(false);
        expect(registry.claim({
            playerId: 8,
            requestId: "same-id"
        }).duplicate).toBe(false);
    });

    test("history limiti asildiginda en eski requestId atilir", () => {
        const registry = createRequestIdRegistry({
            maxEntriesPerPlayer: 2
        });

        registry.claim({ playerId: 7, requestId: "req-1" });
        registry.claim({ playerId: 7, requestId: "req-2" });
        registry.claim({ playerId: 7, requestId: "req-3" });

        expect(registry.claim({
            playerId: 7,
            requestId: "req-1"
        }).duplicate).toBe(false);
    });

    test("requestId yoksa istek takip edilmez", () => {
        const registry = createRequestIdRegistry();

        expect(registry.claim({ playerId: 7 })).toEqual({
            tracked: false,
            duplicate: false
        });
    });
});

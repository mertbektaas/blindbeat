const {
    isAllowedWebSocketOrigin,
    createWebSocketOriginVerifier
} = require("../src/realtime/origin.verifier");

describe("WebSocket Origin doğrulaması", () => {
    const allowedOrigin = "http://localhost:5173";

    test("izin verilen Origin kabul edilir", () => {
        expect(
            isAllowedWebSocketOrigin(allowedOrigin, allowedOrigin)
        ).toBe(true);
    });

    test("farklı Origin reddedilir", () => {
        expect(
            isAllowedWebSocketOrigin(
                "http://kotu-site.example",
                allowedOrigin
            )
        ).toBe(false);
    });

    test("Origin yoksa reddedilir", () => {
        const verifyOrigin = createWebSocketOriginVerifier(allowedOrigin);

        expect(verifyOrigin({ origin: undefined })).toBe(false);
    });
});

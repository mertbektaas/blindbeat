const {
    validateCreateLobby,
    validateJoinLobby
} = require("../src/validation/lobby.schemas");

describe("Lobby schemas", () => {
    test("gecerli create lobby istegini kabul eder", () => {
        const result = validateCreateLobby({
            nickname: "Mert"
        });

        expect(result.valid).toBe(true);
        expect(result.data.nickname).toBe("Mert");
    });

    test("nickname basindaki ve sonundaki bosluklari temizler", () => {
        const result = validateCreateLobby({
            nickname: "  Mert  "
        });

        expect(result.valid).toBe(true);
        expect(result.data.nickname).toBe("Mert");
    });

    test("iki karakterden kisa nicknamei reddeder", () => {
        const result = validateCreateLobby({
            nickname: "M"
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("20 karakterden uzun nicknamei reddeder", () => {
        const result = validateJoinLobby({
            nickname: "abcdefghijklmnopqrstu"
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("gecerli join lobby istegini kabul eder", () => {
        const result = validateJoinLobby({
            nickname: "Ali"
        });

        expect(result.valid).toBe(true);
        expect(result.data.nickname).toBe("Ali");
    });

    test("string olmayan nicknamei reddeder", () => {
        const result = validateJoinLobby({
            nickname: 123
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });
});

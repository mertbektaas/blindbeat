const {
    generateLobbyCode
} = require("../src/utils/lobby-code");

describe("Lobby code utility", () => {
    test("varsayilan olarak 4 karakterli kod uretir", () => {
        const code = generateLobbyCode();

        expect(code).toHaveLength(4);
    });

    test("istenen uzunlukta kod uretir", () => {
        const code = generateLobbyCode(8);

        expect(code).toHaveLength(8);
    });

    test("kod sadece izin verilen karakterleri kullanir", () => {
        const code = generateLobbyCode(100);

        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    });
});

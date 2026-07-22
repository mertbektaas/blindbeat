const {
    PLAYER_SESSION_COOKIE,
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie
} = require("../src/cookies/player-session.cookie");

describe("Player session cookie", () => {
    test("token icin HttpOnly cookie olusturur", () => {
        const cookie = createPlayerSessionCookie("abc123");

        expect(cookie).toContain(`${PLAYER_SESSION_COOKIE}=abc123`);
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Path=/");
    });

    test("cookie header icinden tokeni okur", () => {
        const cookieHeader = `${PLAYER_SESSION_COOKIE}=abc123; theme=dark`;

        const token = readPlayerSessionToken(cookieHeader);

        expect(token).toBe("abc123");
    });

    test("cookie header yoksa null doner", () => {
        expect(readPlayerSessionToken(undefined)).toBeNull();
        expect(readPlayerSessionToken("")).toBeNull();
    });

    test("cookieyi max age sifir ile siler", () => {
        const cookie = clearPlayerSessionCookie();

        expect(cookie).toContain(`${PLAYER_SESSION_COOKIE}=`);
        expect(cookie).toContain("Max-Age=0");
    });
});

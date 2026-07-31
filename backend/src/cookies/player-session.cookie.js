const {
    serialize,
    parse
} = require("cookie");

const PLAYER_SESSION_COOKIE = "blindbeat_player_session";

function getDefaultCookieConfig() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/"
    };
}

function createPlayerSessionCookie(token, options = {}) {
    const config = {
        ...getDefaultCookieConfig(),
        ...options
    };

    return serialize(PLAYER_SESSION_COOKIE, token, config);
}

function readPlayerSessionToken(cookieHeader) {
    if(!cookieHeader) {
        return null;
    }

    const cookies = parse(cookieHeader);

    return cookies[PLAYER_SESSION_COOKIE] || null;

}

function clearPlayerSessionCookie(options = {}) {
    const config = {
        ...getDefaultCookieConfig(),
        ...options,
        maxAge: 0
    };

    return serialize(PLAYER_SESSION_COOKIE, "", config);
}

module.exports = {
    PLAYER_SESSION_COOKIE,
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie,
    getDefaultCookieConfig
};
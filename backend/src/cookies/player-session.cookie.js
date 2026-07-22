const {
    serialize,
    parse
} = require("cookie");

const PLAYER_SESSION_COOKIE = "blindbeat_player_session";

function createPlayerSessionCookie(token) {
    return serialize(
        PLAYER_SESSION_COOKIE, 
        token, {
        httpOnly: true,
        sameSite: "lax",
        secure:false,
        path: "/",
    });
}

function readPlayerSessionToken(cookieHeader) {
    if(!cookieHeader) {
        return null;
    }

    const cookies = parse(cookieHeader);

    return cookies[PLAYER_SESSION_COOKIE] || null;

}

function clearPlayerSessionCookie() {
    // aynı cookie adını kullan
    // maxAge: 0 ile silinecek cookie üret
    return serialize(
        PLAYER_SESSION_COOKIE, 
        "", {
        httpOnly: true,
        sameSite: "lax",
        secure:false,
        path: "/",
        maxAge: 0
    });
}

module.exports = {
    PLAYER_SESSION_COOKIE,
    createPlayerSessionCookie,
    readPlayerSessionToken,
    clearPlayerSessionCookie
};
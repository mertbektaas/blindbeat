function isAllowedWebSocketOrigin(origin, allowedOrigin) {
    return typeof origin === "string" && origin === allowedOrigin;
}

function createWebSocketOriginVerifier(allowedOrigin) {
    return ({ origin }) => isAllowedWebSocketOrigin(origin, allowedOrigin);
}

module.exports = {
    isAllowedWebSocketOrigin,
    createWebSocketOriginVerifier
};

function isAllowedWebSocketOrigin(origin, allowedOrigin) {
    if (typeof origin !== "string") {
        return false;
    }

    // Exact match - works for same-origin and production
    if (origin === allowedOrigin) {
        return true;
    }

    const isProduction = process.env.NODE_ENV === "production";

    // In development / testing, allow localhost and ngrok tunnels
    if (!isProduction) {
        const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:");
        const isLocalIP = origin.startsWith("http://127.0.0.1:") || origin.startsWith("https://127.0.0.1:");
        const isNgrok = /\.ngrok\.io$/.test(origin) || /\.ngrok-free\.app$/.test(origin) || /\.ngrok-free\.dev$/.test(origin);

        if (isLocalhost || isLocalIP || isNgrok) {
            return true;
        }
    }

    return false;
}

function createWebSocketOriginVerifier(allowedOrigin) {
    return ({ origin }) => isAllowedWebSocketOrigin(origin, allowedOrigin);
}

module.exports = {
    isAllowedWebSocketOrigin,
    createWebSocketOriginVerifier
};

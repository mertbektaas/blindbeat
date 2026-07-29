function registerSocket(socket) {
    socket.isAlive = true;

    if (
        typeof socket.on === "function" &&
        socket.__blindBeatHeartbeatRegistered !== true
    ) {
        socket.__blindBeatHeartbeatRegistered = true;
        socket.on("pong", () => {
            socket.isAlive = true;
        });
    }
}

function startHeartbeat(webSocketServer, intervalMs = 5000) {
    webSocketServer.clients.forEach(registerSocket);

    if (typeof webSocketServer.on === "function") {
        webSocketServer.on("connection", registerSocket);
    }

    const interval = setInterval(() => {
        webSocketServer.clients.forEach((socket) => {
            if (socket.isAlive === false) {
                socket.terminate();
                return;
            }

            registerSocket(socket);
            socket.isAlive = false;
            socket.ping();
        });
    }, intervalMs);

    return () => clearInterval(interval);
}

module.exports = {
    startHeartbeat
};

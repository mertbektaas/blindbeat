function startHeartbeat(webSocketServer, intervalMs = 5000) {
    const interval = setInterval(() => {
        webSocketServer.clients.forEach((socket) => {
            if (socket.isAlive === false) {
                socket.terminate();
                return;
            }

            socket.isAlive = false;
            socket.ping();
        });
    }, intervalMs);

    return () => clearInterval(interval);
}

module.exports = {
    startHeartbeat
};

function closeHttpServer(server) {
    if (!server || !server.listening) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function closeWebSocketServer(webSocketServer) {
    if (!webSocketServer) {
        return Promise.resolve();
    }

    for (const socket of webSocketServer.clients || []) {
        socket.terminate();
    }

    return new Promise((resolve, reject) => {
        webSocketServer.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function createShutdownHandler({
    getServer,
    getWebSocketServer,
    getStopHeartbeat,
    roundDeadlineScheduler,
    disconnectDatabase,
    logger,
    exit = () => {}
}) {
    let shutdownPromise = null;

    function shutdown(signal) {
        if (shutdownPromise) {
            return shutdownPromise;
        }

        shutdownPromise = (async () => {
            logger.info("server_shutdown_started", { signal });

            roundDeadlineScheduler.stop();
            getStopHeartbeat()?.();

            await closeWebSocketServer(getWebSocketServer());
            await closeHttpServer(getServer());
            await disconnectDatabase();

            logger.info("server_shutdown_completed");
            exit(0);
        })();

        return shutdownPromise;
    }

    return {
        shutdown
    };
}

module.exports = {
    closeHttpServer,
    closeWebSocketServer,
    createShutdownHandler
};

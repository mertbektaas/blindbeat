const {
    createShutdownHandler
} = require("../src/server.shutdown");

describe("Graceful shutdown", () => {
    test("kapanis sirasi scheduler websocket http ve database olarak ilerler", async () => {
        const events = [];
        const handler = createShutdownHandler({
            getServer: () => ({
                listening: true,
                close: (callback) => {
                    events.push("http");
                    callback();
                }
            }),
            getWebSocketServer: () => ({
                clients: new Set([
                    {
                        terminate: () => events.push("socket")
                    }
                ]),
                close: (callback) => {
                    events.push("websocket");
                    callback();
                }
            }),
            getStopHeartbeat: () => () => events.push("heartbeat"),
            roundDeadlineScheduler: {
                stop: () => events.push("scheduler")
            },
            disconnectDatabase: async () => events.push("database"),
            logger: {
                info: (event) => events.push(event)
            },
            exit: (code) => events.push(`exit:${code}`)
        });

        await handler.shutdown("SIGTERM");

        expect(events).toEqual([
            "server_shutdown_started",
            "scheduler",
            "heartbeat",
            "socket",
            "websocket",
            "http",
            "database",
            "server_shutdown_completed",
            "exit:0"
        ]);
    });

    test("tekrarlanan kapanis cagrisinda ayni promise kullanilir", () => {
        const handler = createShutdownHandler({
            getServer: () => null,
            getWebSocketServer: () => null,
            getStopHeartbeat: () => null,
            roundDeadlineScheduler: { stop: jest.fn() },
            disconnectDatabase: jest.fn().mockResolvedValue(),
            logger: { info: jest.fn() },
            exit: jest.fn()
        });

        const first = handler.shutdown("SIGINT");
        const second = handler.shutdown("SIGTERM");

        expect(second).toBe(first);
    });
});

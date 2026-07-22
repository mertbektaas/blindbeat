const { startHeartbeat } = require("../src/realtime/heartbeat");

describe("WebSocket heartbeat", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("canli socketi pingler ve pong sonrasi canli birakir", () => {
        const socket = {
            isAlive: true,
            ping: jest.fn(),
            terminate: jest.fn()
        };

        const webSocketServer = {
            clients: new Set([socket])
        };

        const stopHeartbeat = startHeartbeat(webSocketServer, 5000);

        jest.advanceTimersByTime(5000);

        expect(socket.ping).toHaveBeenCalledTimes(1);
        expect(socket.isAlive).toBe(false);

        socket.isAlive = true;
        jest.advanceTimersByTime(5000);

        expect(socket.ping).toHaveBeenCalledTimes(2);
        expect(socket.terminate).not.toHaveBeenCalled();

        stopHeartbeat();
    });

    test("pong donmeyen socketi sonlandırır", () => {
        const socket = {
            isAlive: true,
            ping: jest.fn(),
            terminate: jest.fn()
        };

        const webSocketServer = {
            clients: new Set([socket])
        };

        const stopHeartbeat = startHeartbeat(webSocketServer, 5000);

        jest.advanceTimersByTime(10000);

        expect(socket.ping).toHaveBeenCalledTimes(1);
        expect(socket.terminate).toHaveBeenCalledTimes(1);

        stopHeartbeat();
    });

    test("heartbeat durdurulunca yeni ping atmaz", () => {
        const socket = {
            isAlive: true,
            ping: jest.fn(),
            terminate: jest.fn()
        };

        const webSocketServer = {
            clients: new Set([socket])
        };

        const stopHeartbeat = startHeartbeat(webSocketServer, 5000);
        stopHeartbeat();

        jest.advanceTimersByTime(10000);

        expect(socket.ping).not.toHaveBeenCalled();
        expect(socket.terminate).not.toHaveBeenCalled();
    });
});

const {
    createGameStateBroadcaster
} = require("../src/realtime/game-state.broadcaster");

describe("GameStateBroadcaster", () => {
    function createRuntime() {
        return {
            stateVersion: 9,
            players: new Map([
                [1, { playerId: 1 }],
                [2, { playerId: 2 }]
            ])
        };
    }

    function createSocket() {
        return {
            readyState: 1,
            send: jest.fn()
        };
    }

    function createBroadcaster({
        runtime = createRuntime(),
        sockets = new Map(),
        snapshot = null
    } = {}) {
        const runtimeRegistry = {
            getRuntime: jest.fn(() => runtime)
        };
        const connectionRegistry = {
            getSocketByPlayerId: jest.fn((playerId) => sockets.get(playerId))
        };
        const createGameStateSnapshot = jest.fn((currentRuntime, playerId) => {
            return snapshot || {
                stateVersion: currentRuntime.stateVersion,
                viewerPlayerId: playerId
            };
        });

        const broadcaster = createGameStateBroadcaster({
            runtimeRegistry,
            connectionRegistry,
            createGameStateSnapshot
        });

        return {
            broadcaster,
            runtimeRegistry,
            connectionRegistry,
            createGameStateSnapshot
        };
    }

    test("oyuncuya ozel game state snapshot gonderir", () => {
        const socket = createSocket();
        const {
            broadcaster,
            createGameStateSnapshot
        } = createBroadcaster({
            sockets: new Map([[1, socket]])
        });

        const result = broadcaster.sendGameStateSnapshot({
            sessionId: 12,
            playerId: 1
        });

        expect(result).toEqual({
            sent: true,
            stateVersion: 9
        });
        expect(createGameStateSnapshot).toHaveBeenCalledWith(
            expect.any(Object),
            1
        );
        expect(socket.send).toHaveBeenCalledTimes(1);
        expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({
            type: "game:state",
            payload: {
                stateVersion: 9,
                viewerPlayerId: 1
            }
        });
    });

    test("runtime veya oyuncu yoksa mesaj gondermez", () => {
        const socket = createSocket();
        const runtime = {
            stateVersion: 9,
            players: new Map()
        };
        const { broadcaster } = createBroadcaster({
            runtime,
            sockets: new Map([[1, socket]])
        });

        const result = broadcaster.sendGameStateSnapshot({
            sessionId: 12,
            playerId: 1
        });

        expect(result).toEqual({
            sent: false
        });
        expect(socket.send).not.toHaveBeenCalled();
    });

    test("kapali sockete mesaj gondermez", () => {
        const socket = {
            readyState: 3,
            send: jest.fn()
        };
        const { broadcaster } = createBroadcaster({
            sockets: new Map([[1, socket]])
        });

        const result = broadcaster.sendGameStateSnapshot({
            sessionId: 12,
            playerId: 1
        });

        expect(result).toEqual({
            sent: false
        });
        expect(socket.send).not.toHaveBeenCalled();
    });

    test("broadcast her oyuncu icin ayri snapshot gonderir", () => {
        const firstSocket = createSocket();
        const secondSocket = createSocket();
        const {
            broadcaster,
            createGameStateSnapshot
        } = createBroadcaster({
            sockets: new Map([
                [1, firstSocket],
                [2, secondSocket]
            ])
        });

        const result = broadcaster.broadcastGameState(12);

        expect(result).toEqual({
            sentCount: 2
        });
        expect(createGameStateSnapshot).toHaveBeenCalledTimes(2);
        expect(createGameStateSnapshot).toHaveBeenNthCalledWith(
            1,
            expect.any(Object),
            1
        );
        expect(createGameStateSnapshot).toHaveBeenNthCalledWith(
            2,
            expect.any(Object),
            2
        );
        expect(firstSocket.send).toHaveBeenCalledTimes(1);
        expect(secondSocket.send).toHaveBeenCalledTimes(1);
    });

    test("bagli olmayan oyuncular gonderim sayisina dahil edilmez", () => {
        const connectedSocket = createSocket();
        const { broadcaster } = createBroadcaster({
            sockets: new Map([[1, connectedSocket]])
        });

        const result = broadcaster.broadcastGameState(12);

        expect(result).toEqual({
            sentCount: 1
        });
        expect(connectedSocket.send).toHaveBeenCalledTimes(1);
    });

    test("runtime yoksa broadcast mesaj gondermez", () => {
        const runtimeRegistry = {
            getRuntime: jest.fn(() => undefined)
        };
        const connectionRegistry = {
            getSocketByPlayerId: jest.fn()
        };
        const createGameStateSnapshot = jest.fn();
        const broadcaster = createGameStateBroadcaster({
            runtimeRegistry,
            connectionRegistry,
            createGameStateSnapshot
        });

        const result = broadcaster.broadcastGameState(12);

        expect(result).toEqual({
            sentCount: 0
        });
        expect(createGameStateSnapshot).not.toHaveBeenCalled();
    });
});

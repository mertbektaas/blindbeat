const {
    createSessionRuntimeBootstrap
} = require("../src/game/session.runtime.bootstrap");

describe("SessionRuntimeBootstrap", () => {
    test("instrumentleri orderNo sirasina gore runtimea aktarir", () => {
        const runtime = {
            sessionId: 30,
            sessionInstrumentIds: [4, 7, 9]
        };
        const runtimeRegistry = {
            getOrCreateRuntime: jest.fn(() => runtime)
        };
        const bootstrap = createSessionRuntimeBootstrap({
            runtimeRegistry
        });

        const sessionInstruments = [
            { instrumentId: 9, orderNo: 3 },
            { instrumentId: 4, orderNo: 1 },
            { instrumentId: 7, orderNo: 2 }
        ];

        const result = bootstrap.createRuntimeForSession({
            session: { id: 30 },
            playerIds: [11, 12],
            sessionInstruments
        });

        expect(result).toBe(runtime);
        expect(runtimeRegistry.getOrCreateRuntime).toHaveBeenCalledWith({
            sessionId: 30,
            playerIds: [11, 12],
            sessionInstrumentIds: [4, 7, 9]
        });
    });

    test("session instrument listesini degistirmez", () => {
        const runtimeRegistry = {
            getOrCreateRuntime: jest.fn(() => ({}))
        };
        const bootstrap = createSessionRuntimeBootstrap({
            runtimeRegistry
        });
        const sessionInstruments = [
            { instrumentId: 9, orderNo: 3 },
            { instrumentId: 4, orderNo: 1 }
        ];
        const originalList = [...sessionInstruments];

        bootstrap.createRuntimeForSession({
            session: { id: 30 },
            playerIds: [11],
            sessionInstruments
        });

        expect(sessionInstruments).toEqual(originalList);
    });

    test("sessiondaki oyuncu IDlerini runtime registrye aktarir", () => {
        const runtimeRegistry = {
            getOrCreateRuntime: jest.fn(() => ({}))
        };
        const bootstrap = createSessionRuntimeBootstrap({
            runtimeRegistry
        });

        bootstrap.createRuntimeForSession({
            session: { id: 30 },
            playerIds: [21, 22, 23],
            sessionInstruments: [
                { instrumentId: 4, orderNo: 1 }
            ]
        });

        expect(runtimeRegistry.getOrCreateRuntime).toHaveBeenCalledWith({
            sessionId: 30,
            playerIds: [21, 22, 23],
            sessionInstrumentIds: [4]
        });
    });
});

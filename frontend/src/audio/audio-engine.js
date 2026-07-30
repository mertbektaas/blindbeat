const REQUIRED_METHODS = [
    "initialize",
    "preload",
    "schedulePattern",
    "start",
    "stop"
];

function createAudioEngine(implementation) {
    if (!implementation) {
        throw new Error("Audio engine implementation is required.");
    }

    for (const methodName of REQUIRED_METHODS) {
        if (typeof implementation[methodName] !== "function") {
            throw new Error(`Audio engine method is missing: ${methodName}`);
        }
    }

    return {
        initialize: implementation.initialize,
        preload: implementation.preload,
        schedulePattern: implementation.schedulePattern,
        start: implementation.start,
        stop: implementation.stop
    };
}

export {
    createAudioEngine
};

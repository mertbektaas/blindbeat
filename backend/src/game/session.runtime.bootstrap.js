
function createSessionRuntimeBootstrap({
    runtimeRegistry
}) {
    function createRuntimeForSession({
        session,
        playerIds,
        sessionInstruments,
        instruments = [],
        matchId
    }) {
        // sessionInstruments listesini orderNo sırasına göre düzenle
        const orderedInstruments = [...sessionInstruments].sort(
            (a, b) => a.orderNo - b.orderNo
        );

        const sessionInstrumentIds = orderedInstruments.map(
            ({ instrumentId }) => instrumentId
        );

        const instrumentById = new Map(
            instruments.map((instrument) => [instrument.id, instrument])
        );

        const sessionInstrumentCodes = orderedInstruments.map((slot) => {
            return slot.instrument?.code
                || instrumentById.get(slot.instrumentId)?.code
                || null;
        });

        const sessionInstrumentCategories = orderedInstruments.map((slot) => {
            return slot.instrument?.category
                || instrumentById.get(slot.instrumentId)?.category
                || null;
        });

        const runtimeOptions = {
            sessionId: session.id,
            playerIds,
            sessionInstrumentIds,
            matchId: matchId,
            stepCount: session.stepCount,
            maxMatchCount: session.maxMatchCount
        };

        if (sessionInstrumentCodes.some(Boolean)) {
            runtimeOptions.sessionInstrumentCodes = sessionInstrumentCodes;
            runtimeOptions.sessionInstrumentCategories = sessionInstrumentCategories;
        }

        if (session.bpm !== undefined) {
            runtimeOptions.bpm = session.bpm;
        }

        if (session.playbackLoops !== undefined) {
            runtimeOptions.playbackLoops = session.playbackLoops;
        }

        return runtimeRegistry.getOrCreateRuntime(runtimeOptions);
    }

    return {
        createRuntimeForSession
    };
}

module.exports = {
    createSessionRuntimeBootstrap
};

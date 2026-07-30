function calculatePlaybackTiming({
    bpm,
    stepCount,
    playbackLoops
}) {
    const stepDurationSeconds = ((60 / bpm) * (4 / stepCount))
    const loopDurationSeconds = (stepDurationSeconds * stepCount)
    const totalDurationSeconds = (loopDurationSeconds * playbackLoops)

    return {
        stepDurationSeconds,
        loopDurationSeconds,
        totalDurationSeconds,
        playbackLoops
    };
}

function calculatePlaybackStartDelay({
    startAt,
    serverTime
}) {
    const startAtMs = Date.parse(startAt);
    const serverTimeMs = Date.parse(serverTime);

    if (!Number.isFinite(startAtMs) || !Number.isFinite(serverTimeMs)) {
        throw new Error("Playback start zamanlari gecersiz.");
    }

    return Math.max((startAtMs - serverTimeMs) / 1000, 0);
}

export {
    calculatePlaybackTiming,
    calculatePlaybackStartDelay
};

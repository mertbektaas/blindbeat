function createPlaybackProgressTracker({
    onUpdate = () => {},
    onComplete = () => {}
} = {}) {
    let animationFrameId = null;
    let startedAt = null;
    let durationSeconds = 0;
    let currentCompletionHandler = null;

    function stop() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = null;
        startedAt = null;
        currentCompletionHandler = null;
    }

    function update(now) {
        const elapsedSeconds = (now - startedAt) / 1000;
        const progress = Math.min(elapsedSeconds / durationSeconds, 1);

        onUpdate({
            progress,
            elapsedSeconds,
            remainingSeconds: Math.max(durationSeconds - elapsedSeconds, 0)
        });

        if (progress >= 1) {
            animationFrameId = null;
            startedAt = null;
            onComplete();
            currentCompletionHandler?.();
            currentCompletionHandler = null;
            return;
        }

        animationFrameId = requestAnimationFrame(update);
    }

    function start(nextDurationSeconds, { onComplete: nextCompletionHandler } = {}) {
        if (!Number.isFinite(nextDurationSeconds) || nextDurationSeconds <= 0) {
            throw new Error("Playback duration must be greater than zero.");
        }

        stop();
        durationSeconds = nextDurationSeconds;
        currentCompletionHandler = nextCompletionHandler || null;
        startedAt = performance.now();
        onUpdate({
            progress: 0,
            elapsedSeconds: 0,
            remainingSeconds: durationSeconds
        });
        animationFrameId = requestAnimationFrame(update);
    }

    function reset() {
        stop();
        onUpdate({
            progress: 0,
            elapsedSeconds: 0,
            remainingSeconds: durationSeconds
        });
    }

    return {
        start,
        stop,
        reset
    };
}

export {
    createPlaybackProgressTracker
};

import * as Tone from "tone";
import { createAudioEngine } from "./audio-engine.js";

function createToneAudioEngine({
    createInstrumentAdapters = () => ({})
} = {}) {
    const scheduledEventIds = new Set();
    let instrumentAdapters = {};
    let outputMeter = null;
    let ownedRawContext = null;
    let initialized = false;
    let contextNeedsRebuild = true;

    function disposeInstrumentAdapters() {
        for (const adapter of Object.values(instrumentAdapters)) {
            if (typeof adapter.dispose === "function") {
                adapter.dispose();
            }
        }

        instrumentAdapters = {};
    }

    function disposeOutputMeter() {
        outputMeter?.dispose();
        outputMeter = null;
    }

    function unlockNativeAudioContext() {
        const rawContext = Tone.getContext().rawContext;

        if (!rawContext?.createOscillator || !rawContext?.createGain) {
            return;
        }

        const oscillator = rawContext.createOscillator();
        const gain = rawContext.createGain();
        const now = rawContext.currentTime;

        gain.gain.setValueAtTime(0.00001, now);
        oscillator.connect(gain);
        gain.connect(rawContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.01);
    }

    async function rebuildContext() {
        stop();
        disposeInstrumentAdapters();
        disposeOutputMeter();

        const NativeAudioContext = (
            window.AudioContext ||
            window.webkitAudioContext
        );

        if (!NativeAudioContext) {
            throw new Error("Web Audio API is not supported.");
        }

        const nextContext = new NativeAudioContext({
            latencyHint: "interactive"
        });

        Tone.setContext(nextContext, true);
        ownedRawContext = nextContext;
        await nextContext.resume();
        await Tone.start();

        unlockNativeAudioContext();
        outputMeter = new Tone.Meter({
            normalRange: true,
            smoothing: 0.5
        });
        Tone.getDestination().connect(outputMeter);
        instrumentAdapters = createInstrumentAdapters();
        initialized = true;
        contextNeedsRebuild = false;
    }

    async function initialize() {
        if (!initialized || contextNeedsRebuild) {
            await rebuildContext();
            return;
        }

        await resume();
    }

    async function resume() {
        const contextState = Tone.getContext().state;

        if (contextNeedsRebuild || contextState !== "running") {
            await rebuildContext();
            return;
        }

        await Tone.start();
        await Tone.getContext().resume();
        unlockNativeAudioContext();
        initialized = true;
    }

    async function preload() {
        await Tone.loaded();
    }

    function schedulePattern({
        pattern,
        instrument,
        startAt,
        timing
    }) {
        if (!initialized) {
            throw new Error("Audio engine is not initialized.");
        }

        const instrumentCode = typeof instrument === "string"
            ? instrument
            : instrument?.code;

        const adapter = instrumentAdapters[instrumentCode];

        if (!adapter || typeof adapter.schedule !== "function") {
            throw new Error(`Instrument adapter is missing: ${instrumentCode}`);
        }

        const eventId = Tone.getTransport().schedule((audioTime) => {
            adapter.schedule({
                pattern,
                time: audioTime,
                timing
            });
        }, startAt);

        scheduledEventIds.add(eventId);

        return eventId;
    }

    function previewPattern({
        pattern,
        instrument,
        timing,
        startAt = Tone.now() + 0.05
    }) {
        if (!initialized) {
            throw new Error("Audio engine is not initialized.");
        }

        const instrumentCode = typeof instrument === "string"
            ? instrument
            : instrument?.code;

        const adapter = instrumentAdapters[instrumentCode];

        if (!adapter || typeof adapter.schedule !== "function") {
            throw new Error(`Instrument adapter is missing: ${instrumentCode}`);
        }

        adapter.schedule({
            pattern,
            time: startAt,
            timing
        });
    }

    function start() {
        const transport = Tone.getTransport();

        if (transport.state === "started") {
            transport.stop();
            transport.cancel();
        }

        transport.position = 0;
        transport.start("+0.05");
    }

    function stop() {
        const transport = Tone.getTransport();

        for (const adapter of Object.values(instrumentAdapters)) {
            if (typeof adapter.stop === "function") {
                adapter.stop();
            }
        }

        for (const eventId of scheduledEventIds) {
            transport.clear(eventId);
        }

        transport.stop();
        transport.cancel();
        transport.position = 0;
        scheduledEventIds.clear();
    }

    function dispose() {
        stop();
        disposeInstrumentAdapters();
        disposeOutputMeter();
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        if (
            ownedRawContext &&
            ownedRawContext.state !== "closed"
        ) {
            void ownedRawContext.close();
        }

        ownedRawContext = null;
        initialized = false;
        contextNeedsRebuild = true;
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            contextNeedsRebuild = true;
        }
    }

    function getDiagnostics() {
        const context = Tone.getContext();

        return {
            state: context.state,
            rawState: context.rawContext?.state,
            currentTime: context.currentTime,
            sampleRate: context.sampleRate,
            contextType: context.rawContext?.constructor?.name,
            destinationMuted: Tone.getDestination().mute,
            destinationVolume: Tone.getDestination().volume.value,
            contextNeedsRebuild,
            initialized
        };
    }

    function measureOutput(durationMs = 800) {
        return new Promise((resolve) => {
            let peak = 0;
            let measurementError = null;

            const sampleInterval = window.setInterval(() => {
                try {
                    const rawValue = outputMeter?.getValue();
                    const values = Array.isArray(rawValue)
                        ? rawValue
                        : [rawValue];

                    for (const value of values) {
                        peak = Math.max(peak, Number(value) || 0);
                    }
                } catch (error) {
                    measurementError = error;
                }
            }, 25);

            window.setTimeout(() => {
                window.clearInterval(sampleInterval);

                resolve({
                    peak,
                    error: measurementError
                });
            }, durationMs);
        });
    }

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    const audioEngine = createAudioEngine({
        initialize,
        preload,
        schedulePattern,
        start,
        stop
    });

    return {
        ...audioEngine,
        previewPattern,
        resume,
        getDiagnostics,
        measureOutput,
        isInitialized: () => initialized,
        dispose
    };
}

export {
    createToneAudioEngine
};

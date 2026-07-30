import { createDrumSynthAdapter } from "./instrument-adapters/drum-synth.adapter.js";
import { createMelodicSynthAdapter } from "./instrument-adapters/melodic-synth.adapter.js";
import { createToneAudioEngine } from "./tone-audio-engine.js";

function createAppAudioEngine() {
    return createToneAudioEngine({
        createInstrumentAdapters: () => ({
            drums: createDrumSynthAdapter(),
            bass: createMelodicSynthAdapter(),
            "chord-synth": createMelodicSynthAdapter(),
            "lead-synth": createMelodicSynthAdapter()
        })
    });
}

export {
    createAppAudioEngine
};

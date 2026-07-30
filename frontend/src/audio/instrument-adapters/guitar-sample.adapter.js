import * as Tone from "tone";

function createGuitarSampleAdapter({
    sampleUrls = {},
    baseUrl = "/audio/guitar/"
} = {}) {
    const sampler = new Tone.Sampler({
        urls: sampleUrls,
        baseUrl
    }).toDestination();

    function schedule({ pattern, time, timing }) {
        if (Object.keys(sampleUrls).length === 0) {
            throw new Error("Guitar samples are not configured.");
        }

        const steps = pattern?.data?.steps || [];
        const noteDuration = Math.max(timing.stepDurationSeconds * 0.9, 0.05);

        steps.forEach((step, stepIndex) => {
            if (!step?.note) {
                return;
            }

            const stepTime = time + stepIndex * timing.stepDurationSeconds;

            sampler.triggerAttackRelease(
                step.note,
                noteDuration,
                stepTime,
                step.velocity
            );
        });
    }

    function dispose() {
        sampler.dispose();
    }

    function stop() {
        sampler.releaseAll(Tone.now());
    }

    return {
        schedule,
        stop,
        dispose
    };
}

export {
    createGuitarSampleAdapter
};

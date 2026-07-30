import * as Tone from "tone";
import { isValidMelodicNote } from "../note.validation.js";

function createMelodicSynthAdapter() {
    const synth = new Tone.PolySynth(Tone.Synth, {
        envelope: {
            attack: 0.005,
            decay: 0.08,
            sustain: 0.35,
            release: 0.015
        }
    }).toDestination();

    function schedule({ pattern, time, timing }) {
        const steps = pattern?.data?.steps || [];
        const noteDuration = Math.max(
            timing.stepDurationSeconds - 0.025,
            0.005
        );

        steps.forEach((step, stepIndex) => {
            if (!step?.note || !isValidMelodicNote(step.note)) {
                return;
            }

            const stepTime = time + stepIndex * timing.stepDurationSeconds;

            synth.triggerAttackRelease(
                step.note,
                noteDuration,
                stepTime,
                step.velocity
            );
        });
    }

    function dispose() {
        synth.dispose();
    }

    function stop() {
        synth.releaseAll(Tone.now());
    }

    return {
        schedule,
        stop,
        dispose
    };
}

export {
    createMelodicSynthAdapter
};

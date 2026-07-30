import * as Tone from "tone";

function createDrumSynthAdapter() {
    const kick = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 5,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.001,
            decay: 0.28,
            sustain: 0,
            release: 0.05
        }
    }).toDestination();

    const snare = new Tone.NoiseSynth({
        noise: {
            type: "white"
        },
        envelope: {
            attack: 0.001,
            decay: 0.12,
            sustain: 0
        }
    }).toDestination();

    const hiHatFilter = new Tone.Filter({
        frequency: 7000,
        type: "highpass",
        rolloff: -24
    }).toDestination();

    const hiHat = new Tone.NoiseSynth({
        noise: {
            type: "white"
        },
        envelope: {
            attack: 0.001,
            decay: 0.08,
            sustain: 0,
            release: 0.01
        }
    }).connect(hiHatFilter);

    function schedule({ pattern, time, timing }) {
        const steps = pattern?.data?.steps || [];

        steps.forEach((step, stepIndex) => {
            const stepTime = time + stepIndex * timing.stepDurationSeconds;

            if (step.kick) {
                kick.triggerAttackRelease("C1", 0.18, stepTime);
            }

            if (step.snare) {
                snare.triggerAttackRelease(0.12, stepTime);
            }

            if (step.hiHat) {
                hiHat.triggerAttackRelease(0.05, stepTime);
            }
        });
    }

    function dispose() {
        kick.dispose();
        snare.dispose();
        hiHat.dispose();
        hiHatFilter.dispose();
    }

    return {
        schedule,
        dispose
    };
}

export {
    createDrumSynthAdapter
};

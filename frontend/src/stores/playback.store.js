import { defineStore } from "pinia";

const usePlaybackStore = defineStore("playback", {
    state: () => ({
        phase: "IDLE",
        variants: [],
        variantOrder: [],
        songVariantPlaying: null,
        bpm: null,
        stepCount: null,
        playbackLoops: null,
        startAt: null,
        progress: 0,
        audioReady: false,
        error: null
    }),

    getters: {
        isPlaybackActive: (state) => state.phase === "PLAYBACK",
        progressPercent: (state) => Math.round(state.progress * 100),
        currentVariantIndex: (state) => (
            state.variantOrder.indexOf(state.songVariantPlaying)
        )
    },

    actions: {
        setVariants(variants) {
            this.variants = variants;
        },

        setPlaybackData({ session, variants }) {
            this.variants = variants;
            this.bpm = session.bpm;
            this.stepCount = session.stepCount;
            this.playbackLoops = session.playbackLoops;
            this.error = null;
        },

        markAudioReady() {
            this.audioReady = true;
        },

        setPlaybackStart(payload) {
            this.phase = "PLAYBACK";
            this.variantOrder = payload.variantOrder || [];
            this.songVariantPlaying = null;
            this.bpm = payload.bpm;
            this.stepCount = payload.stepCount;
            this.playbackLoops = payload.playbackLoops;
            this.startAt = payload.startAt;
            this.progress = 0;
            this.error = null;
        },

        setProgress(progress) {
            this.progress = Math.min(Math.max(progress, 0), 1);
        },

        setSongVariantPlaying(songVariantId) {
            this.songVariantPlaying = songVariantId;
        },

        completePlayback() {
            this.phase = "VOTING";
            this.songVariantPlaying = null;
            this.progress = 1;
        },

        resetMatchState() {
            this.phase = "IDLE";
            this.variants = [];
            this.variantOrder = [];
            this.songVariantPlaying = null;
            this.bpm = null;
            this.stepCount = null;
            this.playbackLoops = null;
            this.startAt = null;
            this.progress = 0;
            this.error = null;
        },

        setError(error) {
            this.error = error;
        },

        reset() {
            this.$reset();
        }
    }
});

export {
    usePlaybackStore
};

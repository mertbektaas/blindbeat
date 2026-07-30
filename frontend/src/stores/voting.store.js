import { defineStore } from "pinia";

const useVotingStore = defineStore("voting", {
    state: () => ({
        phase: "IDLE",
        variantOrder: [],
        selectedVariantId: null,
        voteSubmitted: false,
        votingComplete: false,
        winnerVariantIds: [],
        matchResult: null,
        sessionResult: null,
        error: null
    }),

    getters: {
        canVote: (state) =>
            state.phase === "VOTING" && !state.voteSubmitted
    },

    actions: {
        openVoting(variantOrder) {
            this.phase = "VOTING";
            this.variantOrder = [...variantOrder];
            this.selectedVariantId = null;
            this.voteSubmitted = false;
            this.votingComplete = false;
            this.winnerVariantIds = [];
            this.matchResult = null;
            this.sessionResult = null;
            this.error = null;
        },

        selectVariant(variantId) {
            if (!this.canVote) {
                return false;
            }

            this.selectedVariantId = variantId;
            return true;
        },

        markVoteSubmitted(payload) {
            this.voteSubmitted = true;
            this.votingComplete = Boolean(payload.votingComplete);
            this.winnerVariantIds = payload.matchResult?.winnerVariantIds || [];
            this.matchResult = payload.matchResult || null;

            if (this.votingComplete) {
                this.phase = "MATCH_RESULT";
            }
        },

        setMatchResult(matchResult) {
            this.matchResult = matchResult;
            this.winnerVariantIds = matchResult?.winnerVariantIds || [];
            this.votingComplete = true;
            this.phase = "MATCH_RESULT";
        },

        setSessionResult(sessionResult) {
            this.sessionResult = sessionResult;
            this.phase = "SESSION_RESULT";
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
    useVotingStore
};

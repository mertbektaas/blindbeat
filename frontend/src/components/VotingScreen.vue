<script setup>
import { computed } from "vue";
import { useVotingStore } from "../stores/voting.store.js";

const props = defineProps({
  sendVote: {
    type: Function,
    required: true
  }
});

const votingStore = useVotingStore();

const canSubmit = computed(() => {
  return votingStore.canVote && votingStore.selectedVariantId !== null;
});

function selectVariant(variantId) {
  votingStore.selectVariant(variantId);
}

function submitVote() {
  if (!canSubmit.value) {
    return;
  }

  props.sendVote(votingStore.selectedVariantId);
}
</script>

<template>
  <section v-if="votingStore.phase === 'VOTING'" class="voting-screen">
    <h2>Bir şarkı seç</h2>

    <div class="vote-options">
      <button
        v-for="(variantId, index) in votingStore.variantOrder"
        :key="variantId"
        type="button"
        :class="{ selected: votingStore.selectedVariantId === variantId }"
        @click="selectVariant(variantId)"
      >
        Şarkı {{ index + 1 }}
      </button>
    </div>

    <button
      type="button"
      :disabled="!canSubmit"
      @click="submitVote"
    >
      Oyumu gönder
    </button>
  </section>
</template>

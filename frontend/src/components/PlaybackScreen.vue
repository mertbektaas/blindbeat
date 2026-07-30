<script setup>
import { computed } from "vue";
import { usePlaybackStore } from "../stores/playback.store.js";

const playbackStore = usePlaybackStore();

const isVisible = computed(() => {
    return playbackStore.isPlaybackActive || playbackStore.progress > 0;
});

const bars = computed(() => {
    return [1, 2, 3].map((variantNo, index) => ({
        variantNo,
        active: index === playbackStore.currentVariantIndex,
        progress: getVariantProgress(index)
    }));
});

function getVariantProgress(index) {
    const variantProgress = (playbackStore.progress * 3) - index;
    return Math.min(Math.max(variantProgress, 0), 1);
}
</script>

<template>
  <section v-if="isVisible" class="playback-screen" aria-live="polite">
    <h2>Playback</h2>

    <div class="variant-bars">
      <div
        v-for="bar in bars"
        :key="bar.variantNo"
        :class="['variant-bar', { active: bar.active }]"
      >
        <span>Şarkı {{ bar.variantNo }}</span>
        <div class="variant-track">
          <div
            class="variant-fill"
            :style="{ width: `${bar.progress * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <p v-if="playbackStore.phase === 'VOTING'">
      Playback tamamlandı. Oylama hazır.
    </p>
  </section>
</template>

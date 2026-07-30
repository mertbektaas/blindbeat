<script setup>
defineProps({
  result: {
    type: Object,
    default: null
  }
});
</script>

<template>
  <section v-if="result" class="session-result-screen">
    <h2>Session sonucu</h2>

    <ol>
      <li v-for="medal in result.medals" :key="medal.playerId">
        {{ medal.nickname || `Oyuncu ${medal.playerId}` }} ·
        {{ medal.medal }} · {{ medal.totalScore }} puan
      </li>
    </ol>
  </section>
</template>

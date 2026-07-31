<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  result: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["return-to-lobby"]);

const palette = ["#c8f46b", "#c99dff", "#ff769b", "#6bb5f4", "#f5ba58"];
const phase = ref("intro");
const scoreProgress = ref(0);
let counterTimer = null;
let introTimer = null;

const medals = computed(() => props.result?.medals || []);
const ranked = computed(() => {
  const list = [...medals.value].sort(
    (left, right) => right.totalScore - left.totalScore
  );

  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    initials: initials(entry.nickname || `P${entry.playerId}`),
    color: palette[index % palette.length]
  }));
});

const isTied = computed(() => Boolean(props.result?.tied));
const animationComplete = computed(() => scoreProgress.value >= 1);

function initials(name = "?") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function displayedScore(score) {
  return Math.round(score * scoreProgress.value);
}

function clearTimers() {
  window.clearInterval(counterTimer);
  window.clearTimeout(introTimer);
}

function reveal() {
  clearTimers();
  phase.value = "intro";
  scoreProgress.value = 0;

  introTimer = window.setTimeout(() => {
    phase.value = "podium";
    counterTimer = window.setInterval(() => {
      scoreProgress.value = Math.min(1, scoreProgress.value + 0.025);

      if (scoreProgress.value >= 1) {
        window.clearInterval(counterTimer);
      }
    }, 32);
  }, 1800);
}

function onReturnToLobby() {
  emit("return-to-lobby");
}

onMounted(reveal);
onBeforeUnmount(clearTimers);
</script>

<template>
  <main class="session-result" :class="[`phase-${phase}`, { tied: isTied }]">
    <div class="score-lines" aria-hidden="true"><i v-for="line in 15" :key="line"></i></div>

    <section class="result-intro">
      <header class="result-header">
        <span class="brand"><b>bb</b> blind beat</span>
      </header>

      <div class="result-title">
        <span v-if="isTied">skor eşitliği!</span>
        <span v-else>session bitti</span>
        <h1>işte kazananlar</h1>
        <h2>Oyun sona erdi.<br>Kazananlar belli oldu.</h2>
      </div>
    </section>

    <section class="result-stage" aria-live="polite">
      <header>
        <h1 v-if="isTied">Ortak zafer!</h1>
        <h1 v-else>Kim aldı<br>sahneyi?</h1>
      </header>

      <section v-if="ranked.length > 0" class="podium-board" aria-label="Final puan tablosu">
        <article
          v-for="(entry, index) in ranked.slice(0, 3)"
          :key="entry.playerId"
          :class="`podium-place-${entry.rank}`"
          :style="{
            '--player-color': entry.color,
            '--entry-delay': `${index * 160}ms`
          }"
        >
          <span class="podium-rank">{{ entry.rank }}</span>
          <span class="avatar">{{ entry.initials }}</span>
          <strong>{{ entry.nickname || `Oyuncu ${entry.playerId}` }}</strong>
          <b>{{ displayedScore(entry.totalScore) }}<small>puan</small></b>
        </article>
      </section>

      <section v-else class="result-empty">
        <p>Sonuç bulunamadı.</p>
      </section>

      <section v-if="ranked.length > 3" class="runner-up-board" aria-label="Diğer sıralamalar">
        <article
          v-for="(entry, index) in ranked.slice(3)"
          :key="entry.playerId"
          :style="{
            '--player-color': palette[index % palette.length],
            '--entry-delay': `${index * 120}ms`
          }"
        >
          <span class="rank">{{ String(entry.rank).padStart(2, "0") }}</span>
          <span class="avatar">{{ entry.initials }}</span>
          <strong>{{ entry.nickname || `Oyuncu ${entry.playerId}` }}</strong>
          <b>{{ displayedScore(entry.totalScore) }}<small>puan</small></b>
        </article>
      </section>

      <footer v-if="animationComplete" class="result-footer">
        <button
          type="button"
          class="return-to-lobby"
          @click="onReturnToLobby"
        >Lobiye Dön</button>
      </footer>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.session-result {
  --ink: #f8f4f8;
  --muted: #aaa6b6;
  --line: #39364e;
  --lime: #c8f46b;
  --pink: #ff7599;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--ink);
  background: #090a10;
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}

.score-lines {
  position: fixed;
  z-index: 0;
  inset: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  opacity: .32;
  pointer-events: none;
}
.score-lines i {
  width: 1px;
  height: 34vh;
  background: #463159;
  box-shadow: 0 0 18px #b33a71;
  animation: score-line 2.5s ease-in-out infinite alternate;
}
.score-lines i:nth-child(3n) { height: 59vh; background: #29465d; animation-delay: .5s; }
.score-lines i:nth-child(4n) { height: 17vh; animation-delay: 1s; }

@keyframes score-line {
  to { opacity: .6; transform: scaleY(1.08); }
}

.result-intro,
.result-stage {
  position: relative;
  z-index: 1;
  width: min(1180px, calc(100% - 3rem));
  margin: 0 auto;
}

.result-intro {
  min-height: 100vh;
  padding: 1.65rem 0 4rem;
}

.result-header {
  display: flex;
  align-items: center;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  color: var(--ink);
  font: .68rem "DM Mono", monospace;
  letter-spacing: .08em;
}
.brand b {
  display: grid;
  width: 1.55rem;
  height: 1.55rem;
  place-items: center;
  border: 1px solid var(--lime);
  color: var(--lime);
}

.result-title {
  margin-top: clamp(4rem, 10vh, 7.5rem);
  transform-origin: left center;
}

.result-title span {
  display: block;
  margin-bottom: .75rem;
  color: var(--lime);
  font: .72rem "DM Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.result-title h1 {
  margin: 0;
  color: var(--pink);
  font-size: clamp(3rem, 6.2vw, 6rem);
  line-height: .78;
  letter-spacing: -.08em;
}
.result-title h2 {
  max-width: 520px;
  margin: 1.25rem 0 0;
  font-size: clamp(2rem, 4vw, 4rem);
  line-height: .98;
  letter-spacing: -.075em;
}

.phase-podium .result-intro,
.phase-podium .result-title {
  animation: intro-exit 1.6s cubic-bezier(.2, .8, .2, 1) forwards;
}

@keyframes intro-exit {
  to {
    opacity: 0;
    transform: translateY(-6vh) scale(.96);
    pointer-events: none;
  }
}

.result-stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 1.65rem 0 4rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(2rem);
}

.phase-podium .result-stage {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
  transition: opacity .8s ease, transform .8s cubic-bezier(.2, .8, .2, 1);
}

.result-stage header h1 {
  margin: 0 0 2rem;
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  line-height: .92;
  letter-spacing: -.065em;
}

.podium-board {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(1rem, 2.5vw, 2rem);
  min-height: 340px;
  margin-top: 2rem;
}

.podium-board article {
  position: relative;
  display: grid;
  place-items: center;
  width: min(260px, 26vw);
  padding: 1.4rem 1rem;
  border: 1px solid var(--line);
  background: rgb(17 18 33 / .82);
  color: var(--ink);
  text-align: center;
  opacity: 0;
  transform: translateY(40px);
  animation: podium-enter .7s cubic-bezier(.2, .8, .2, 1) forwards;
  animation-delay: var(--entry-delay);
}

.podium-board article::before {
  content: "";
  position: absolute;
  inset: 0;
  border-top: 4px solid var(--player-color);
  opacity: .85;
}

.podium-place-1 {
  order: 2;
  height: 320px;
  z-index: 3;
}
.podium-place-2 {
  order: 1;
  height: 240px;
}
.podium-place-3 {
  order: 3;
  height: 200px;
}

@keyframes podium-enter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.podium-rank {
  position: absolute;
  top: .9rem;
  left: .9rem;
  font: 1.1rem "DM Mono", monospace;
  color: var(--muted);
}

.avatar {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border: 2px solid var(--player-color);
  border-radius: 50%;
  color: var(--player-color);
  font: 1.1rem "DM Mono", monospace;
}

.podium-board strong,
.runner-up-board strong {
  margin-top: .9rem;
  font-size: 1.15rem;
}

.podium-board b,
.runner-up-board b {
  margin-top: .35rem;
  font: 1.6rem "DM Mono", monospace;
  color: var(--player-color);
}
.podium-board b small,
.runner-up-board b small {
  margin-left: .25rem;
  font-size: .55rem;
  color: var(--muted);
  text-transform: uppercase;
}

.runner-up-board {
  display: grid;
  gap: .75rem;
  max-width: 720px;
  margin: 2.5rem auto 0;
}

.runner-up-board article {
  display: grid;
  grid-template-columns: 3rem 2.5rem 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: .9rem 1rem;
  border: 1px solid var(--line);
  background: rgb(17 18 33 / .72);
  opacity: 0;
  transform: translateX(-20px);
  animation: runner-enter .5s cubic-bezier(.2, .8, .2, 1) forwards;
  animation-delay: var(--entry-delay);
}

.runner-up-board .rank {
  font: 1rem "DM Mono", monospace;
  color: var(--muted);
}
.runner-up-board .avatar {
  width: 2.2rem;
  height: 2.2rem;
  font-size: .72rem;
}
.runner-up-board strong {
  margin: 0;
}
.runner-up-board b {
  margin: 0;
  font-size: 1.1rem;
}

@keyframes runner-enter {
  to { opacity: 1; transform: translateX(0); }
}

.result-empty {
  margin-top: 2rem;
  color: var(--muted);
}

.result-footer {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  animation: footer-arrive .6s cubic-bezier(.2, .8, .2, 1) both;
}

.return-to-lobby {
  min-width: 16rem;
  min-height: 3.4rem;
  padding: 0 1.6rem;
  border: 1px solid var(--lime);
  color: #10111f;
  background: var(--lime);
  font: 700 .9rem "DM Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: .2s ease;
}

.return-to-lobby:hover {
  transform: translate(2px, 2px);
  box-shadow: -2px -2px 0 var(--ink);
}

@keyframes footer-arrive {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 760px) {
  .podium-board {
    flex-direction: column;
    align-items: center;
    min-height: auto;
  }
  .podium-board article {
    width: min(320px, 100%);
    height: auto !important;
    min-height: 180px;
  }
  .podium-place-1,
  .podium-place-2,
  .podium-place-3 {
    order: 0;
  }
  .runner-up-board article {
    grid-template-columns: 2.2rem 2rem 1fr auto;
  }
}
</style>

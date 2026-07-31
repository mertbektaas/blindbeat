<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { fetchMatchLeaderboard } from "../api/leaderboard.api.js";

const props = defineProps({
  gameState: {
    type: Object,
    required: true
  },
  apiUrl: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["continue"]);

const phase = ref("resolving");
const entries = ref([]);
const loadError = ref("");
const scoreProgress = ref(0);
const loading = ref(false);
let revealTimer;
let counterTimer;

const palette = ["#c8f46b", "#c99dff", "#ff769b", "#6bb5f4", "#f5ba58"];
const matchId = computed(() => (
  props.gameState?.matchResult?.matchId || props.gameState?.currentMatchId
));
const readyCount = computed(() => (
  (props.gameState?.players || []).filter((player) => player.matchResultReady).length
));
const playerCount = computed(() => props.gameState?.players?.length || 0);
const myReady = computed(() => props.gameState?.myMatchResultReady === true);
const highestScore = computed(() => Math.max(1, ...entries.value.map((entry) => entry.totalScore)));

function initials(nickname = "?") {
  return nickname.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function displayedScore(entry) {
  return Math.round(entry.totalScore * scoreProgress.value);
}

function clearTimers() {
  window.clearTimeout(revealTimer);
  window.clearInterval(counterTimer);
}

function reveal() {
  clearTimers();
  phase.value = "resolving";
  scoreProgress.value = 0;

  revealTimer = window.setTimeout(() => {
    phase.value = "leaderboard";
    counterTimer = window.setInterval(() => {
      scoreProgress.value = Math.min(1, scoreProgress.value + 0.04);

      if (scoreProgress.value >= 1) {
        window.clearInterval(counterTimer);
      }
    }, 28);
  }, 2500);
}

async function loadLeaderboard() {
  if (!matchId.value) {
    return;
  }

  loading.value = true;
  loadError.value = "";

  try {
    entries.value = await fetchMatchLeaderboard({
      apiUrl: props.apiUrl,
      matchId: matchId.value
    });
    reveal();
  } catch (error) {
    loadError.value = error.message || "Puan tablosu alınamadı.";
  } finally {
    loading.value = false;
  }
}

function continueMatch() {
  if (!myReady.value) {
    emit("continue");
  }
}

watch(matchId, loadLeaderboard, { immediate: true });

onBeforeUnmount(clearTimers);
</script>

<template>
  <main class="leaderboard-update" :class="`phase-${phase}`">
    <div class="score-lines" aria-hidden="true"><i v-for="line in 15" :key="line"></i></div>

    <section class="outgoing-scene">
      <header class="outgoing-header">
        <span class="brand"><b>bb</b> blind beat</span>
      </header>

      <div class="outgoing-title">
        <h1>ver bakalım dj!</h1>
        <h2>Üç ayrı ihtimal.<br>Tek bir favori.</h2>
      </div>

      <section class="folding-playback" aria-hidden="true">
        <div class="fold-top"></div><div class="fold-bottom"></div>
        <div class="playback-ghost-content">
          <div class="ghost-orbit"><b>03</b><span>playback bitti</span></div>
          <div class="ghost-tracks"><i v-for="song in 3" :key="song"><span>0{{ song }}</span><b>Şarkı 0{{ song }}</b><em></em></i></div>
        </div>
      </section>

      <section class="vote-exit"><span>Oylar kilitlendi.</span><strong>En iyisi bu demek?</strong></section>
    </section>

    <section class="leaderboard-stage" aria-live="polite">
      <header class="leaderboard-heading"><h1>Kim aldı<br>sahneyi?</h1></header>

      <p v-if="phase === 'resolving' || loading" class="leaderboard-message">Puanlar hesaplanıyor...</p>
      <p v-else-if="loadError" class="leaderboard-message error">{{ loadError }}</p>

      <section v-else class="lift-board" aria-label="Güncel puan tablosu">
        <article
          v-for="(entry, index) in entries"
          :key="entry.nickname"
          :style="{ '--player-color': palette[index % palette.length], '--entry-delay': `${index * 120}ms` }"
        >
          <span class="rank">{{ String(entry.rank).padStart(2, "0") }}</span>
          <span class="avatar">{{ initials(entry.nickname) }}</span>
          <strong>{{ entry.nickname }}</strong>
          <div class="score-rail"><i :style="{ width: `${scoreProgress * (entry.totalScore / highestScore) * 100}%` }"></i></div>
          <b class="score">{{ displayedScore(entry) }}<small>puan</small></b>
        </article>
      </section>

      <footer class="continue-zone">
        <span>{{ readyCount }} / {{ playerCount }} hazır</span>
        <button type="button" :disabled="myReady" @click="continueMatch">
          {{ myReady ? "Diğerleri bekleniyor" : "Hazırım" }}
        </button>
      </footer>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");
.leaderboard-update{--ink:#f8f4f8;--muted:#aaa6b6;--line:#39364e;--lime:#c8f46b;--pink:#ff7599;position:relative;min-height:100vh;overflow:hidden;color:var(--ink);background:#090a10;font-family:"Space Grotesk",ui-sans-serif,system-ui,sans-serif}.score-lines{position:fixed;z-index:0;inset:0;display:flex;justify-content:space-around;align-items:center;opacity:.32;pointer-events:none}.score-lines i{width:1px;height:34vh;background:#463159;box-shadow:0 0 18px #b33a71;animation:score-line 2.5s ease-in-out infinite alternate}.score-lines i:nth-child(3n){height:59vh;background:#29465d;animation-delay:.5s}.score-lines i:nth-child(4n){height:17vh;animation-delay:1s}.outgoing-scene,.leaderboard-stage{position:relative;z-index:1;width:min(1180px,calc(100% - 3rem));margin:0 auto}.outgoing-scene{min-height:100vh;padding:1.65rem 0 4rem}.outgoing-header{display:flex;align-items:center}.brand{display:inline-flex;align-items:center;gap:.45rem;color:var(--ink);font:.68rem "DM Mono",monospace;letter-spacing:.08em}.brand b{display:grid;width:1.55rem;height:1.55rem;place-items:center;border:1px solid var(--lime);color:var(--lime)}.outgoing-title{margin-top:clamp(4rem,10vh,7.5rem);transform-origin:left center}.outgoing-title h1{margin:0;color:var(--pink);font-size:clamp(3rem,6.2vw,6rem);line-height:.78;letter-spacing:-.08em}.outgoing-title h2{max-width:520px;margin:1.25rem 0 0;font-size:clamp(2rem,4vw,4rem);line-height:.98;letter-spacing:-.075em}.phase-resolving .outgoing-title,.phase-leaderboard .outgoing-title{animation:title-exit-left 2.417s cubic-bezier(.2,.8,.2,1) forwards}.folding-playback{position:relative;min-height:360px;margin-top:clamp(2rem,5vh,4.5rem);overflow:hidden;border:1px solid var(--line);background:rgb(17 18 33 / .8);box-shadow:12px 14px 0 rgb(0 0 0 / .24)}.playback-ghost-content{position:relative;z-index:2;display:grid;grid-template-columns:230px 1fr;gap:clamp(2rem,6vw,7rem);align-items:center;height:360px;padding:2rem}.ghost-orbit{display:grid;aspect-ratio:1;width:min(100%,190px);margin:auto;place-items:center;border:1px solid #b34975;border-radius:50%;box-shadow:inset 0 0 0 10px rgb(179 73 117 / .07),0 0 0 15px rgb(179 73 117 / .05)}.ghost-orbit b{font:4.2rem "DM Mono",monospace}.ghost-orbit span{margin-top:-3.3rem;color:var(--muted);font:.57rem "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.ghost-tracks{display:grid;gap:.85rem}.ghost-tracks i{display:grid;grid-template-columns:3rem 1fr 1.4fr;gap:1rem;align-items:center;min-height:5rem;padding:1rem;border:1px solid #343449;color:var(--muted);font-style:normal}.ghost-tracks span,.ghost-tracks b{font:.7rem "DM Mono",monospace}.ghost-tracks b{color:var(--ink);font-family:"Space Grotesk",sans-serif;font-size:1.05rem}.ghost-tracks em{height:4px;background:var(--lime)}.ghost-tracks i:nth-child(2) em{background:#c99dff}.ghost-tracks i:nth-child(3) em{background:var(--pink)}.fold-top,.fold-bottom{position:absolute;z-index:4;right:0;left:0;height:50%;background:#10111d;opacity:0}.fold-top{top:0;transform-origin:top center;border-bottom:1px solid #4a465d}.fold-bottom{bottom:0;transform-origin:bottom center;border-top:1px solid #4a465d}.phase-resolving .playback-ghost-content,.phase-leaderboard .playback-ghost-content{animation:ghost-out 1.2s ease-in forwards}.phase-resolving .fold-top,.phase-leaderboard .fold-top{animation:fold-top 1.833s 433ms cubic-bezier(.7,0,.3,1) forwards}.phase-resolving .fold-bottom,.phase-leaderboard .fold-bottom{animation:fold-bottom 1.833s 433ms cubic-bezier(.7,0,.3,1) forwards}.phase-resolving .folding-playback,.phase-leaderboard .folding-playback{animation:playback-vanish 833ms 2.25s ease-in forwards}.vote-exit{display:flex;justify-content:space-between;align-items:end;margin-top:3.2rem;padding:1.2rem;border-top:1px solid var(--lime);color:var(--lime);font-family:"DM Mono",monospace}.vote-exit span{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase}.vote-exit strong{color:var(--ink);font-family:"Space Grotesk",sans-serif;font-size:clamp(2.5rem,5vw,5rem);line-height:.75;letter-spacing:-.07em}.phase-resolving .vote-exit,.phase-leaderboard .vote-exit{animation:vote-exit 1.5s 417ms cubic-bezier(.5,0,.8,.5) forwards}.leaderboard-stage{position:absolute;z-index:4;top:50%;left:50%;display:grid;width:min(1100px,calc(100% - 3rem));min-height:620px;align-content:center;transform:translate(-50%,-43%);animation:leaderboard-arrive 1.5s cubic-bezier(.2,.9,.3,1) both}.leaderboard-heading{margin-bottom:2.2rem}.leaderboard-heading h1{margin:0;font-size:clamp(3rem,7vw,6.5rem);line-height:.72;letter-spacing:-.09em}.lift-board{display:grid;gap:.65rem;padding:1rem;border:1px solid #45425a;background:#111220;box-shadow:13px 14px 0 rgb(0 0 0 / .26)}.lift-board article{display:grid;grid-template-columns:3rem 2.6rem minmax(90px,1fr) minmax(120px,2fr) 5.2rem;gap:1rem;align-items:center;min-height:5.6rem;padding:1rem;border:1px solid #34344a;background:#0b0c14;animation:lift-row 1.033s var(--entry-delay) cubic-bezier(.2,.9,.3,1) both}.lift-board article:first-child{border-color:var(--player-color);box-shadow:inset 4px 0 0 var(--player-color)}.rank,.score,.avatar{font-family:"DM Mono",monospace}.avatar{display:grid;width:2.25rem;height:2.25rem;place-items:center;border:1px solid var(--player-color);color:var(--player-color);font-size:.65rem}.lift-board strong{font-size:1.2rem}.score-rail{height:5px;overflow:hidden;background:#2c2c41}.score-rail i{display:block;height:100%;background:var(--player-color);box-shadow:0 0 12px var(--player-color);transition:width 28ms linear}.score{justify-self:end;color:var(--player-color);font-size:1.45rem}.score small{display:block;color:var(--muted);font-size:.55rem;text-transform:uppercase}.continue-zone{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:1rem}.continue-zone span{color:var(--muted);font:.7rem "DM Mono",monospace}.continue-zone button{min-width:12rem;min-height:3.5rem;border:1px solid var(--lime);color:#12150d;background:var(--lime);font:700 .85rem "Space Grotesk",sans-serif;cursor:pointer}.continue-zone button:disabled{cursor:not-allowed;opacity:.48}.leaderboard-message{padding:1rem;border:1px solid var(--line);color:var(--muted);font:.75rem "DM Mono",monospace}.leaderboard-message.error{border-color:var(--pink);color:var(--pink)}@keyframes score-line{to{opacity:.28;transform:scaleY(.55)}}@keyframes title-exit-left{to{opacity:0;transform:translateX(-80vw)}}@keyframes ghost-out{to{opacity:0;transform:scaleY(.05)}}@keyframes fold-top{0%{opacity:0;transform:translateY(-100%) scaleY(1)}10%{opacity:1;transform:translateY(0) scaleY(1)}100%{opacity:1;transform:translateY(100%) scaleY(0)}}@keyframes fold-bottom{0%{opacity:0;transform:translateY(100%) scaleY(1)}10%{opacity:1;transform:translateY(0) scaleY(1)}100%{opacity:1;transform:translateY(-100%) scaleY(0)}}@keyframes playback-vanish{to{min-height:0;height:0;margin-top:0;opacity:0;transform:scaleX(.05)}}@keyframes vote-exit{to{opacity:0;transform:translateY(90vh)}}@keyframes leaderboard-arrive{from{opacity:0;transform:translate(-50%,-38%) scale(.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes lift-row{from{opacity:0;transform:translateY(2.3rem)}to{opacity:1;transform:translateY(0)}}@media(max-width:760px){.outgoing-scene,.leaderboard-stage{width:calc(100% - 1.4rem)}.outgoing-title{margin-top:4.5rem}.playback-ghost-content{grid-template-columns:1fr;height:auto;min-height:420px;gap:1.5rem}.ghost-orbit{width:130px}.ghost-tracks i{grid-template-columns:2rem 1fr}.ghost-tracks em{grid-column:2}.vote-exit{display:grid;gap:1rem}.leaderboard-stage{min-height:100vh;padding:3rem 0;transform:translate(-50%,-50%)}.lift-board article{grid-template-columns:2rem 2.3rem 1fr 3.5rem;gap:.6rem}.score-rail{display:none}.continue-zone{align-items:stretch;flex-direction:column}.continue-zone button{width:100%}}
</style>

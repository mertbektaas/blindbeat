<script setup>
import { computed } from "vue";

const props = defineProps({
  lobby: {
    type: Object,
    required: true
  },
  players: {
    type: Array,
    required: true
  },
  patterns: {
    type: Array,
    required: true
  },
  currentStep: {
    type: Number,
    required: true
  },
  pulseColor: {
    type: String,
    required: true
  },
  pulseKey: {
    type: Number,
    required: true
  },
  isReady: Boolean,
  isHost: Boolean,
  gameConfig: {
    type: Object,
    required: true
  },
  availableInstruments: {
    type: Array,
    default: () => []
  },
  connectionStatus: {
    type: String,
    default: "Bağlanıyor..."
  },
  audioStatus: {
    type: String,
    default: "Ses sistemi hazırlanıyor..."
  },
  leaving: Boolean
});

const emit = defineEmits(["toggle-ready", "toggle-step", "config-change", "leave-lobby"]);

const activePlayers = computed(() => props.players.filter((_, index) => (
  props.patterns[index]?.[props.currentStep]
)));

function patternStyle(pattern) {
  return {
    gridTemplateColumns: `repeat(${pattern.length}, minmax(1rem, 1fr))`
  };
}

function toggleInstrument(code) {
  const currentCodes = props.gameConfig.instrumentCodes || [];
  const isSelected = currentCodes.includes(code);
  const newCodes = isSelected
    ? currentCodes.filter(c => c !== code)
    : [...currentCodes, code];

  // Max 6 enstruman siniri
  if (newCodes.length > 6) return;

  emit('config-change', { key: 'instrumentCodes', value: newCodes });
}
</script>

<template>
  <main class="lobby-jam" :style="{ '--pulse-color': pulseColor }">
    <span v-if="activePlayers.length" :key="pulseKey" class="jam-frame-pulse" aria-hidden="true"></span>

    <section class="layout-shell">
      <header class="jam-header">
        <a class="jam-brand" href="#" aria-label="Blind Beat ana sayfa"><span>bb</span> blind beat</a>
        <span class="jam-room-code">room / {{ lobby.code }}</span>
        <button class="leave-button" type="button" :disabled="leaving" @click="$emit('leave-lobby')">
          {{ leaving ? "Çıkılıyor..." : "Çıkış" }}
        </button>
      </header>

      <div class="jam-title">
        <h1>Herkes gelene kadar<br>bir şeyler çal.</h1>
        <p>Oyun başlamadan önceki son serbest alan.</p>
      </div>

      <section class="jam-grid" aria-label="Lobi pattern'leri">
        <article
          v-for="(player, playerIndex) in players"
          :key="player.id || player.nickname"
          class="jam-row"
          :class="[{ self: player.self, ready: player.ready || (player.self && isReady) }, `jam-row-${playerIndex % 4 + 1}`]"
          :style="{ '--player-color': player.pulseColor }"
        >
          <div class="jam-player">
            <span class="jam-avatar">{{ player.initials }}</span>
            <span>{{ player.nickname }}<small v-if="player.self">sen</small></span>
          </div>

          <div class="jam-steps" :style="patternStyle(patterns[playerIndex] || [])" :aria-label="`${player.nickname} pattern'i`">
            <button
              v-for="(active, stepIndex) in patterns[playerIndex] || []"
              :key="stepIndex"
              type="button"
              class="jam-step"
              :class="{ active, playing: active && stepIndex === currentStep, editable: player.self }"
              :aria-label="`${player.nickname} step ${stepIndex + 1}`"
              :disabled="!player.self"
              @click="$emit('toggle-step', playerIndex, stepIndex)"
            ></button>
          </div>

          <span class="jam-state">
            <i :class="{ active: player.ready || (player.self && isReady) }"></i>
            {{ player.ready || (player.self && isReady) ? "hazır" : player.online ? "jam" : "uzakta" }}
          </span>
        </article>
      </section>

      <section class="jam-controls" aria-label="Lobi jam kontrolü">
        <div class="jam-loop-status"><span></span> loop:open</div>
        <button class="ready-button" :class="{ ready: isReady }" type="button" @click="$emit('toggle-ready')">
          {{ isReady ? "Birazdan başlıyoruz!" : "Hazırım" }}
        </button>
      </section>

      <section class="game-config-lab" aria-labelledby="game-config-title">
        <header class="config-lab-header">
          <div>
            <h2 id="game-config-title">Oyun Ayarları</h2>
          </div>
          <span>{{ isHost ? "Ayarlar sende" : "Ayarlar oda sahibinde" }} · {{ connectionStatus }} · {{ audioStatus }}</span>
        </header>

        <div class="config-fader-panel">
          <label class="fader-control">
            <span>{{ gameConfig.instrumentRoundSeconds }}<small>sn</small></span>
            <input type="range" min="15" max="60" step="5" :value="gameConfig.instrumentRoundSeconds" :disabled="!isHost" @change="$emit('config-change', { key: 'instrumentRoundSeconds', value: Number($event.target.value) })">
            <b>Tur süresi</b>
          </label>
          <label class="fader-control bpm-control">
            <div class="number-stepper">
              <button type="button" :disabled="!isHost || gameConfig.bpm <= 60" @click="$emit('config-change', { key: 'bpm', value: gameConfig.bpm - 5 })">−</button>
              <input class="bpm-input" type="number" min="60" max="160" step="5" :value="gameConfig.bpm" :disabled="!isHost" @change="$emit('config-change', { key: 'bpm', value: Number($event.target.value) })">
              <button type="button" :disabled="!isHost || gameConfig.bpm >= 160" @click="$emit('config-change', { key: 'bpm', value: gameConfig.bpm + 5 })">+</button>
            </div>
            <b>Tempo</b>
          </label>
          <label class="fader-control bpm-control">
            <div class="number-stepper">
              <button type="button" :disabled="!isHost || gameConfig.stepCount <= 8" @click="$emit('config-change', { key: 'stepCount', value: gameConfig.stepCount - 8 })">−</button>
              <input class="bpm-input" type="number" :value="gameConfig.stepCount" readonly aria-label="Step sayısı">
              <button type="button" :disabled="!isHost || gameConfig.stepCount >= 32" @click="$emit('config-change', { key: 'stepCount', value: gameConfig.stepCount + 8 })">+</button>
            </div>
            <b>Step sayısı</b>
          </label>
          <label class="fader-control">
            <span>{{ gameConfig.maxMatchCount }}</span>
            <input type="range" min="1" max="5" step="1" :value="gameConfig.maxMatchCount" :disabled="!isHost" @change="$emit('config-change', { key: 'maxMatchCount', value: Number($event.target.value) })">
            <b>Maç sayısı</b>
          </label>
        </div>

        <div class="instrument-selector">
          <div class="instrument-header">
            <h3>Enstrümanlar</h3>
            <span class="instrument-count">{{ gameConfig.instrumentCodes?.length || 0 }} / 6 seçili</span>
          </div>
          <div class="instrument-grid">
            <button
              v-for="instrument in availableInstruments"
              :key="instrument.code"
              type="button"
              class="instrument-chip"
              :class="{ selected: gameConfig.instrumentCodes?.includes(instrument.code) }"
              :disabled="!isHost || (
                !gameConfig.instrumentCodes?.includes(instrument.code) &&
                (gameConfig.instrumentCodes?.length || 0) >= 6
              )"
              @click="toggleInstrument(instrument.code)"
            >
              <span class="instrument-name">{{ instrument.name }}</span>
              <span class="instrument-category">{{ instrument.category }}</span>
            </button>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.lobby-jam { --black: #090a10; --ink: #f4eff5; --muted: #aaa5b7; --line: #2a2b40; --purple: #33245c; --burgundy: #8b1e4a; --ready: #c6f46d; position: relative; min-height: 100vh; overflow: hidden; color: var(--ink); background: #0a0a12; font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
.lobby-jam *, .lobby-jam *::before, .lobby-jam *::after { box-sizing: border-box; }
.layout-shell { min-height: 100vh; padding: 1.5rem 2rem 6rem; }
.jam-frame-pulse { position: fixed; z-index: 20; inset: 0; width: 100vw; height: 100dvh; pointer-events: none; background: radial-gradient(ellipse 30% 22% at 50% -6%, var(--pulse-color), transparent 76%), radial-gradient(ellipse 22% 32% at 104% 50%, var(--pulse-color), transparent 78%), radial-gradient(ellipse 26% 22% at 48% 106%, var(--pulse-color), transparent 78%), radial-gradient(ellipse 19% 29% at -4% 52%, var(--pulse-color), transparent 78%); box-shadow: inset 0 0 76px 18px var(--pulse-color); filter: blur(16px); opacity: 0; animation: jam-frame-hit 260ms ease-out; }
.jam-header { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; max-width: 1240px; margin: 0 auto; }
.jam-brand { display: inline-flex; align-items: center; justify-self: start; gap: 0.6rem; color: var(--ink); text-decoration: none; font-size: 1rem; font-weight: 700; }.jam-brand span { display: grid; width: 2rem; height: 2rem; place-items: center; border: 2px solid var(--burgundy); border-radius: 7px; color: var(--burgundy); font-family: "DM Mono", monospace; font-size: 0.72rem; transform: rotate(-5deg); }
.jam-room-code { color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.68rem; letter-spacing: 0.12em; }.leave-button { justify-self: end; border: 0; color: var(--muted); background: transparent; font: inherit; cursor: pointer; font-size: 0.85rem; }.leave-button:hover { color: var(--ink); }.leave-button:disabled { cursor: wait; opacity: 0.6; }
.jam-title { max-width: 1100px; margin: 5.5rem auto 0; }.jam-title h1 { margin: 0; font-size: clamp(3rem, 6vw, 4.3rem); line-height: 0.9; letter-spacing: 0; }.jam-title > p { margin: 1.1rem 0 0; color: var(--muted); }
.jam-grid { display: grid; gap: 1.1rem; max-width: 1140px; margin: 3.2rem auto 0; }.jam-row { display: grid; grid-template-columns: 9.5rem minmax(430px, 1fr) 4.5rem; align-items: center; gap: 1rem; min-height: 5.7rem; padding: 0.8rem 1rem; border: 1px solid #28233d; border-radius: 10px; background: #131322; box-shadow: 6px 7px 0 #05050a; }.jam-row-1 { transform: rotate(-0.55deg) translateX(-1.7rem); }.jam-row-2 { transform: rotate(0.35deg) translateX(1rem); background: #161426; }.jam-row-3 { transform: rotate(-0.2deg) translateX(-0.5rem); background: #101522; }.jam-row-4 { transform: rotate(0.5deg) translateX(2.2rem); }.jam-row.self { border-color: var(--burgundy); background: #1c1020; }.jam-row.ready { border-color: #4a6941; }
.jam-player { display: flex; align-items: center; gap: 0.7rem; font-weight: 700; }.jam-player small { display: block; margin-top: 0.18rem; color: var(--muted); font-size: 0.68rem; font-weight: 400; }.jam-avatar { display: grid; flex: 0 0 auto; width: 2.6rem; height: 2.6rem; place-items: center; border: 1px solid currentColor; border-radius: 8px; color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.68rem; }.jam-row.self .jam-avatar { color: var(--ready); border-color: var(--ready); }
.jam-steps { display: grid; gap: 0.35rem; }.jam-step { display: block; aspect-ratio: 1; min-width: 0; border: 1px solid #43405d; border-radius: 4px; background: #0c0c16; }.jam-step.active { border-color: var(--player-color); background: var(--player-color); box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.16); }.jam-step.playing { position: relative; z-index: 1; border-color: #fff; box-shadow: 0 0 0 2px var(--player-color), 0 0 18px 4px var(--player-color), inset 0 0 0 2px rgb(255 255 255 / 0.58); animation: jam-step-hit 180ms ease-out; }.jam-step.editable { cursor: pointer; }.jam-step.editable:hover { border-color: var(--ready); }.jam-step:disabled { opacity: 0.65; }
.jam-state { display: inline-flex; justify-content: flex-end; align-items: center; gap: 0.35rem; color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.65rem; }.jam-state i, .jam-loop-status span { display: block; width: 0.42rem; height: 0.42rem; border-radius: 50%; background: #49465a; }.jam-state i.active, .jam-loop-status span { background: var(--ready); }
.jam-controls { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 1.5rem; max-width: 1100px; margin: 3rem auto 0; padding: 1rem 0; border-top: 1px solid var(--line); }.jam-loop-status { display: flex; align-items: center; gap: 0.45rem; color: var(--ready); font-family: "DM Mono", monospace; font-size: 0.72rem; }.ready-button { min-height: 3.25rem; border: 2px solid var(--ink); border-radius: 7px; padding: 0.8rem 1rem; color: var(--ink); background: var(--burgundy); box-shadow: 4px 4px 0 var(--ink); font: inherit; font-weight: 700; cursor: pointer; }.ready-button:hover { transform: translate(1px, 1px); box-shadow: 3px 3px 0 var(--ink); }.ready-button.ready { color: var(--black); background: var(--ready); }
.game-config-lab { max-width: 1100px; margin: 3.5rem auto 0; padding: 1.25rem 0 0; border-top: 1px solid var(--line); }.config-lab-header { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; }.config-lab-header h2 { margin: 0; font-size: 1.65rem; }.config-lab-header > span { color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.68rem; }.config-fader-panel { display: grid; grid-template-columns: repeat(4, 1fr); gap: .8rem; margin-top: 1.35rem; padding: 1rem; border: 1px solid #403557; border-radius: 8px; background: linear-gradient(120deg, #141226, #1c1325); }.fader-control { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .7rem; min-width: 0; padding: .9rem; border: 1px solid #4e4062; border-radius: 5px; background: #0d0d18; cursor: pointer; }.fader-control > span { grid-row: span 2; display: grid; width: 2.9rem; min-height: 2.9rem; place-content: center; border: 1px solid #bf73d7; border-radius: 50%; color: #f5eaf7; background: #39214b; text-align: center; font-family: "DM Mono", monospace; font-size: .9rem; }.fader-control small { margin-top: -.15rem; color: #d1a8df; font-size: .56rem; }.fader-control input { width: 100%; accent-color: #c993ff; cursor: ew-resize; }.fader-control input:disabled { cursor: not-allowed; opacity: .45; }.fader-control b { color: var(--muted); font-family: "DM Mono", monospace; font-size: .62rem; font-weight: 400; }
@keyframes jam-frame-hit { 0% { opacity: 0.88; } 100% { opacity: 0; } } @keyframes jam-step-hit { 0% { transform: scale(1.12); } 100% { transform: scale(1); } }
.bpm-control { grid-template-columns: 1fr; }.number-stepper { display: grid; grid-template-columns: 2.9rem minmax(0, 1fr) 2.9rem; gap: .4rem; }.number-stepper button { border: 1px solid #b9285b; border-radius: 5px; color: #ff7aa4; background: #351021; font-family: "DM Mono", monospace; font-size: 1.45rem; font-weight: 700; line-height: 1; cursor: pointer; }.number-stepper button:hover:not(:disabled) { color: #fff2f6; background: #8b1e4a; }.number-stepper button:disabled { cursor: not-allowed; opacity: .36; }.bpm-input { min-width: 0; min-height: 2.9rem; border: 1px solid #bf73d7; border-radius: 5px; padding: 0 .7rem; color: #f5eaf7; background: #21152c; font-family: "DM Mono", monospace; font-size: 1rem; text-align: center; cursor: text !important; }.bpm-input:focus { outline: 2px solid #c993ff; outline-offset: 2px; }.bpm-input:disabled { cursor: not-allowed !important; }
.instrument-selector { max-width: 1100px; margin: 1.5rem auto 0; padding: 1rem; border: 1px solid #403557; border-radius: 8px; background: linear-gradient(120deg, #141226, #1c1325); }.instrument-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }.instrument-header h3 { margin: 0; font-size: 1.1rem; color: var(--ink); }.instrument-count { color: var(--muted); font-family: "DM Mono", monospace; font-size: .72rem; }.instrument-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .6rem; }.instrument-chip { display: flex; flex-direction: column; align-items: flex-start; padding: .7rem .9rem; border: 1px solid #4e4062; border-radius: 6px; background: #0d0d18; color: var(--muted); font-family: inherit; font-size: .85rem; cursor: pointer; transition: all .2s ease; text-align: left; }.instrument-chip:hover:not(:disabled) { border-color: #c993ff; background: #1a1428; }.instrument-chip.selected { border-color: var(--ready); background: #1a2814; color: var(--ink); }.instrument-chip:disabled { cursor: not-allowed; opacity: .4; }.instrument-name { font-weight: 600; margin-bottom: .2rem; }.instrument-category { font-size: .65rem; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
@media (max-width: 760px) { .layout-shell { padding: 1rem 1rem 6rem; }.jam-header { grid-template-columns: 1fr auto; }.jam-room-code { display: none; }.jam-title { margin-top: 4rem; }.jam-grid { gap: 0.8rem; overflow-x: auto; padding: 0.8rem 1rem 1.2rem; margin-right: -1rem; margin-left: -1rem; }.jam-row { grid-template-columns: 7rem minmax(370px, 1fr) 3.6rem; gap: 0.7rem; min-width: 620px; min-height: 4.7rem; }.jam-row-1, .jam-row-2, .jam-row-3, .jam-row-4 { transform: none; }.jam-steps { gap: 0.25rem; }.jam-controls { gap: 1rem; }.game-config-lab { margin-top: 2.5rem; }.config-lab-header { align-items: start; flex-direction: column; }.config-fader-panel { grid-template-columns: 1fr; } }
</style>

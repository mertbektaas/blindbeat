<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { isValidMelodicNote } from "../audio/note.validation.js";

const props = defineProps({
  gameState: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["ready", "draft-update", "preview", "lock"]);

const draft = ref(null);
const selectedSynthStep = ref(0);
const activeOctave = ref(3);
const accidentalMode = ref("sharp");
const currentStep = ref(0);
const localError = ref("");
let stepTimer;

const OCTAVES = Array.from({ length: 6 }, (_, index) => index + 2);
const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEYS = [
  { sharp: "C#", flat: "Db", position: "14.3%" },
  { sharp: "D#", flat: "Eb", position: "28.6%" },
  { sharp: "F#", flat: "Gb", position: "57.1%" },
  { sharp: "G#", flat: "Ab", position: "71.4%" },
  { sharp: "A#", flat: "Bb", position: "85.7%" }
];

const isMatchStarting = computed(() => props.gameState?.phase === "MATCH_STARTING");
const isInstrumentRound = computed(() => props.gameState?.phase === "INSTRUMENT_ROUND");
const isDrum = computed(() => props.gameState?.currentInstrumentCategory === "drums");
const stepCount = computed(() => props.gameState?.myDraftPattern?.stepCount || props.gameState?.stepCount || 8);
const instrumentCode = computed(() => props.gameState?.currentInstrumentCode || "instrument");
const instrumentTitle = computed(() => `${toTitle(instrumentCode.value)} Round`);
const locked = computed(() => props.gameState?.myLocked === true);
const accent = computed(() => isDrum.value ? "#c6f46d" : "#c992ff");
const secondsLeft = computed(() => {
  const deadline = Date.parse(props.gameState?.deadlineAt || "");
  if (!Number.isFinite(deadline)) return "--";
  return String(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))).padStart(2, "0");
});
const selectedSynthNote = computed(() => draft.value?.data?.steps?.[selectedSynthStep.value]?.note || null);
const drumLane = computed(() => {
  const code = instrumentCode.value.toLowerCase();
  if (code === "snare") return "snare";
  if (code === "hi-hat" || code === "hihat" || code === "hi_hat") return "hiHat";
  return "kick";
});

function toTitle(value) {
  return value
    .split("-")
    .map(part => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "")
    .join(" ");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptyDraft() {
  const steps = isDrum.value
    ? Array.from({ length: stepCount.value }, () => ({
        kick: false,
        snare: false,
        hiHat: false
      }))
    : Array.from({ length: stepCount.value }, () => null);

  return {
    version: 1,
    instrumentType: isDrum.value ? "drums" : instrumentCode.value,
    stepCount: stepCount.value,
    data: { steps }
  };
}

function syncDraft() {
  draft.value = props.gameState?.myDraftPattern
    ? clone(props.gameState.myDraftPattern)
    : createEmptyDraft();
  selectedSynthStep.value = 0;
  currentStep.value = 0;
  localError.value = "";
}

function restartStepTimer() {
  window.clearInterval(stepTimer);

  if (!isInstrumentRound.value || !draft.value?.stepCount) return;

  const bpm = Number(props.gameState?.bpm) || 120;
  const duration = ((60 / bpm) * (4 / draft.value.stepCount)) * 1000;

  stepTimer = window.setInterval(() => {
    currentStep.value = (currentStep.value + 1) % draft.value.stepCount;
  }, duration);
}

watch(
  () => [
    props.gameState?.matchNumber,
    props.gameState?.currentInstrumentCode,
    props.gameState?.phase
  ],
  () => {
    syncDraft();
    restartStepTimer();
  },
  { immediate: true }
);

watch(
  () => [props.gameState?.bpm, stepCount.value],
  restartStepTimer
);

onBeforeUnmount(() => window.clearInterval(stepTimer));

function emitDraft() {
  if (draft.value && isInstrumentRound.value && !locked.value) {
    emit("draft-update", clone(draft.value));
  }
}

function toggleDrumStep(index) {
  draft.value.data.steps[index][drumLane.value] = !draft.value.data.steps[index][drumLane.value];
  emitDraft();
}

function selectSynthStep(index) {
  selectedSynthStep.value = index;
}

function setSynthNote(pitchClass) {
  if (locked.value) return;

  draft.value.data.steps[selectedSynthStep.value] = {
    note: `${pitchClass}${activeOctave.value}`,
    velocity: 0.8
  };
  emitDraft();
  selectedSynthStep.value = (selectedSynthStep.value + 1) % draft.value.data.steps.length;
}

function clearSynthStep(index) {
  if (locked.value) return;

  draft.value.data.steps[index] = null;
  selectedSynthStep.value = index;
  emitDraft();
}

function clearDraft() {
  if (locked.value) return;
  draft.value = createEmptyDraft();
  selectedSynthStep.value = 0;
  emitDraft();
}

function previewDraft() {
  if (!draft.value) return;

  const hasInvalidNote = !isDrum.value && draft.value.data.steps.some(
    step => step?.note && !isValidMelodicNote(step.note)
  );

  if (hasInvalidNote) {
    localError.value = "Geçersiz nota seçildi.";
    return;
  }

  localError.value = "";
  emit("preview", clone(draft.value));
}

function lockDraft() {
  if (draft.value && !locked.value) emit("lock");
}
</script>

<template>
  <main
    v-if="isMatchStarting || isInstrumentRound"
    class="round-signal"
    :style="{ '--signal-accent': accent }"
  >
    <div class="signal-lines" aria-hidden="true"><i v-for="line in 18" :key="line"></i></div>

    <section class="signal-readout">
      <span>{{ isMatchStarting ? "sinyal bekleniyor" : "girdi alındı" }}</span>
      <h1>{{ isMatchStarting ? "Hazır" : instrumentTitle }}</h1>
      <strong>{{ isMatchStarting ? "tur açılıyor" : "tur açık" }}</strong>
    </section>

    <button
      v-if="isMatchStarting"
      type="button"
      class="ready-signal"
      @click="emit('ready')"
    >
      Hazırım
    </button>

    <section v-else-if="draft" class="signal-composer" :class="{ 'synth-composer': !isDrum }">
      <header class="signal-header">
        <button type="button" class="clear-draft" :disabled="locked" @click="clearDraft">Temizle</button>
        <span>00:{{ secondsLeft }}</span>
      </header>

      <div v-if="isDrum" class="signal-grid" :style="{ gridTemplateColumns: `repeat(${draft.data.steps.length}, minmax(0, 1fr))` }">
        <button
          v-for="(step, index) in draft.data.steps"
          :key="index"
          type="button"
          :disabled="locked"
          :class="{ active: step[drumLane], playing: index === currentStep }"
          :aria-label="`${instrumentCode} step ${index + 1}`"
          @click="toggleDrumStep(index)"
        ><i></i></button>
      </div>

      <template v-else>
        <div class="signal-grid synth-step-grid" :style="{ gridTemplateColumns: `repeat(${draft.data.steps.length}, minmax(0, 1fr))` }">
          <div
            v-for="(step, index) in draft.data.steps"
            :key="index"
            class="synth-step-cell"
            :class="{ active: step, focused: selectedSynthStep === index, playing: index === currentStep }"
          >
            <button
              v-if="step"
              type="button"
              class="synth-step-clear"
              :disabled="locked"
              :aria-label="`${step.note} notasını sil`"
              @click="clearSynthStep(index)"
            >×</button>
            <button type="button" class="synth-step-button" :disabled="locked" @click="selectSynthStep(index)">
              {{ step?.note || "—" }}
            </button>
          </div>
        </div>

        <section class="synth-note-dock" aria-label="Synth nota seçimi">
          <div class="octave-picker">
            <button v-for="octave in OCTAVES" :key="octave" type="button" :class="{ active: activeOctave === octave }" :disabled="locked" @click="activeOctave = octave">{{ octave }}</button>
          </div>
          <button type="button" class="accidental-toggle" :disabled="locked" @click="accidentalMode = accidentalMode === 'sharp' ? 'flat' : 'sharp'">{{ accidentalMode === 'sharp' ? '# / b' : 'b / #' }}</button>
          <div class="piano-keyboard">
            <button v-for="note in WHITE_KEYS" :key="note" type="button" :class="{ selected: selectedSynthNote === `${note}${activeOctave}` }" :disabled="locked" @click="setSynthNote(note)">{{ note }}{{ activeOctave }}</button>
            <button
              v-for="key in BLACK_KEYS"
              :key="key.sharp"
              type="button"
              :style="{ '--key-position': key.position }"
              :class="{ selected: selectedSynthNote === `${accidentalMode === 'sharp' ? key.sharp : key.flat}${activeOctave}` }"
              :disabled="locked"
              @click="setSynthNote(accidentalMode === 'sharp' ? key.sharp : key.flat)"
            >{{ accidentalMode === 'sharp' ? key.sharp : key.flat }}{{ activeOctave }}</button>
          </div>
        </section>
      </template>

      <footer class="signal-actions">
        <button type="button" class="preview-button" :disabled="locked" @click="previewDraft">Dinle</button>
        <button type="button" class="signal-lock" :disabled="locked" @click="lockDraft">{{ locked ? "PATTERN KİLİTLENDİ" : "PATTERNİ KİLİTLE" }}</button>
      </footer>
      <p v-if="localError" class="signal-error">{{ localError }}</p>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.round-signal { position: relative; display: grid; min-height: 100vh; overflow: hidden; place-items: center; color: #f5f0f7; background: #08090f; font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
.round-signal *, .round-signal *::before, .round-signal *::after { box-sizing: border-box; }
.signal-lines { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(18, 1fr); align-items: center; gap: .7rem; padding: 0 5vw; opacity: .55; pointer-events: none; }.signal-lines i { display: block; height: 2px; background: linear-gradient(90deg, transparent, #81345a, transparent); transform-origin: center; animation: signal-scan 1.35s ease-in-out infinite alternate; }.signal-lines i:nth-child(3n) { animation-delay: 160ms; }.signal-lines i:nth-child(4n) { animation-delay: 320ms; }
.signal-readout { position: absolute; z-index: 2; display: grid; place-items: center; text-align: center; pointer-events: none; animation: signal-readout 2.75s cubic-bezier(.22,.8,.22,1) forwards; }.signal-readout span, .signal-readout strong { color: #aaa5b7; font-family: "DM Mono", monospace; font-size: .68rem; letter-spacing: .12em; text-transform: uppercase; }.signal-readout strong { color: var(--signal-accent); }.signal-readout h1 { max-width: 95vw; margin: .2rem 0; color: #f8eff7; font-size: clamp(4.8rem, 13vw, 10rem); line-height: .83; letter-spacing: 0; text-shadow: 5px 0 #641a42, -5px 0 #262b70; }
.ready-signal { position: relative; z-index: 4; min-width: 13rem; min-height: 4rem; margin-top: 17rem; border: 1px solid var(--signal-accent); color: #11121a; background: var(--signal-accent); box-shadow: 6px 6px 0 #150810; font: 700 .9rem "DM Mono", monospace; letter-spacing: .1em; cursor: pointer; animation: ready-in 600ms 1.65s both; }.ready-signal:hover { transform: translate(2px, 2px); box-shadow: 4px 4px 0 #150810; }
.signal-composer { position: absolute; z-index: 3; top: 59%; left: 50%; display: grid; gap: clamp(.75rem, .45rem + .75vw, 1rem); width: min(86vw, 1280px); padding: clamp(1.15rem, .65rem + .85vw, 1.7rem); border: 1px solid #4b4a69; background: #111225; box-shadow: 0 20px 60px rgb(0 0 0 / .38); opacity: 0; transform: translate(-50%, -42%) scale(.92); animation: signal-console-in 720ms 2.35s cubic-bezier(.2,.85,.25,1) forwards; }.synth-composer { top: 64%; }
.signal-header { display: flex; align-items: center; justify-content: space-between; min-height: 1.75rem; color: #aaa5b7; font: .68rem "DM Mono", monospace; }.signal-header span { color: #b9285b; }.clear-draft { border: 1px solid #5a4c61; border-radius: 3px; padding: .35rem .55rem; color: #d8cdd8; background: #171320; font: .66rem "DM Mono", monospace; cursor: pointer; }.clear-draft:hover:not(:disabled) { border-color: #e5a6bd; color: #fff1f6; background: #6a2445; }
.signal-grid { display: grid; gap: clamp(.55rem, .3rem + .72vw, 1rem); padding-inline: clamp(.1rem, .1rem + .3vw, .55rem); }.signal-grid > button { display: grid; height: clamp(3rem, 4.4vw, 4.1rem); min-width: 0; padding: .25rem; place-items: center; border: 1px solid #454662; border-radius: 5px; background: #080914; cursor: pointer; }.signal-grid > button i { display: block; width: 1px; height: 20%; background: #57566f; }.signal-grid > button.active { border-color: var(--signal-accent); background: color-mix(in srgb, var(--signal-accent) 20%, #152116); }.signal-grid > button.active i { width: 55%; height: 74%; background: var(--signal-accent); box-shadow: 0 0 12px var(--signal-accent); }.signal-grid > button.playing { position: relative; z-index: 2; border-color: #fff; box-shadow: 0 0 0 2px var(--signal-accent), 0 0 22px 5px color-mix(in srgb, var(--signal-accent) 72%, transparent), inset 0 0 0 2px rgb(255 255 255 / .48); animation: signal-step-hit 180ms ease-out; }
.synth-step-grid { align-items: stretch; }.synth-step-cell { position: relative; min-width: 0; height: clamp(3rem, 4.4vw, 4.1rem); }.synth-step-button { width: 100%; height: 100%; min-width: 0; border: 1px solid #454662; border-radius: 5px; color: #aaa5b7; background: #080914; font: clamp(.58rem, 1.1vw, .8rem) "DM Mono", monospace; cursor: pointer; }.synth-step-cell.active .synth-step-button { border-color: var(--signal-accent); background: color-mix(in srgb, var(--signal-accent) 20%, #152116); }.synth-step-cell.focused .synth-step-button { outline: 2px solid #f5eff6; outline-offset: 3px; }.synth-step-cell.playing .synth-step-button { position: relative; z-index: 2; border-color: #fff; box-shadow: 0 0 0 2px var(--signal-accent), 0 0 22px 5px color-mix(in srgb, var(--signal-accent) 72%, transparent); animation: signal-step-hit 180ms ease-out; }.synth-step-clear { position: absolute; z-index: 5; top: -.5rem; right: -.45rem; display: grid; width: 1.35rem; height: 1.35rem; padding: 0; place-items: center; border: 1px solid #e5a6bd; border-radius: 50%; color: #fff4f8; background: #6a2445; box-shadow: 0 2px 7px rgb(0 0 0 / .38); cursor: pointer; font-size: .9rem; line-height: 1; }
.synth-note-dock { display: grid; grid-template-columns: auto 1fr; gap: .75rem 1rem; margin-top: .25rem; padding-top: clamp(1rem, .6rem + .7vw, 1.45rem); border-top: 1px solid #383951; }.octave-picker { display: grid; grid-template-columns: repeat(6, 1fr); gap: .28rem; }.octave-picker button, .accidental-toggle { border: 1px solid #4a4a63; border-radius: 3px; color: #aaa5b7; background: #0a0b15; cursor: pointer; font: .72rem "DM Mono", monospace; }.octave-picker button { width: 2rem; height: 2rem; }.octave-picker button.active { border-color: var(--signal-accent); color: #10110d; background: var(--signal-accent); }.accidental-toggle { min-width: 4.4rem; }.piano-keyboard { position: relative; grid-column: 1 / -1; display: flex; height: clamp(5.5rem, 6.4vw, 6.9rem); padding-right: 0; border: 1px solid #4a4a63; border-radius: 4px; overflow: hidden; background: #f0e7f1; }.piano-keyboard > button { position: relative; z-index: 1; flex: 1; min-width: 0; border: 0; border-right: 1px solid #8d8291; color: #241b29; background: #f0e7f1; cursor: pointer; font: clamp(.55rem, .9vw, .74rem) "DM Mono", monospace; }.piano-keyboard > button:nth-of-type(7) { border-right: 0; }.piano-keyboard > button:hover:not(:disabled), .piano-keyboard > button.selected { color: #10110d; background: var(--signal-accent); }.piano-keyboard > button:nth-of-type(n + 8) { position: absolute; z-index: 3; top: 0; left: var(--key-position); width: 9%; height: 58%; border: 1px solid #07070c; border-radius: 0 0 4px 4px; color: #f0e7f1; background: #17131d; transform: translateX(-50%); }.piano-keyboard > button:nth-of-type(n + 8):hover:not(:disabled), .piano-keyboard > button:nth-of-type(n + 8).selected { color: #110d14; background: var(--signal-accent); }
.signal-actions { display: grid; grid-template-columns: auto 1fr; gap: .75rem; }.preview-button, .signal-lock { min-height: clamp(3.2rem, 3.6vw, 4rem); border: 1px solid var(--signal-accent); font: .82rem "DM Mono", monospace; letter-spacing: .1em; cursor: pointer; }.preview-button { padding: 0 1rem; color: #f5eaf7; background: #24152a; }.signal-lock { color: #10130c; background: var(--signal-accent); }.signal-actions button:disabled, .signal-composer button:disabled { cursor: not-allowed; opacity: .48; }.signal-error { margin: 0; color: #ff9ab9; font: .7rem "DM Mono", monospace; }
@keyframes signal-scan { to { transform: scaleY(38); opacity: .14; } } @keyframes signal-readout { 0%, 48% { opacity: 0; transform: scale(.6); } 64% { opacity: 1; transform: scale(1); } 100% { opacity: .2; transform: translateY(-13rem) scale(.38); } } @keyframes signal-console-in { from { opacity: 0; transform: translate(-50%, -35%) scale(.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } } @keyframes signal-step-hit { 0% { transform: scale(1.08); filter: brightness(1.6); } 100% { transform: scale(1); filter: brightness(1); } } @keyframes ready-in { from { opacity: 0; transform: translateY(2rem); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 950px) { .signal-grid { grid-template-columns: repeat(8, 1fr) !important; }.signal-grid > button, .synth-step-cell { height: clamp(2.9rem, 9vw, 4.15rem); }.synth-composer { top: 62%; } }
@media (max-width: 700px) { .signal-lines { gap: .35rem; padding: 0 1rem; }.signal-readout h1 { font-size: clamp(3.9rem, 17vw, 6.4rem); }.signal-composer { top: 57%; width: calc(100% - 1.5rem); }.synth-composer { top: 58%; }.signal-grid { gap: .45rem; padding-inline: 0; }.signal-grid > button, .synth-step-cell { height: clamp(2.75rem, 10vw, 3.8rem); }.synth-note-dock { gap: .65rem; }.octave-picker { grid-column: 1 / -1; }.octave-picker button { width: auto; }.piano-keyboard { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .4rem; height: auto; border: 0; overflow: visible; background: transparent; }.piano-keyboard > button, .piano-keyboard > button:nth-of-type(n + 8) { position: relative; top: auto; left: auto; width: auto; min-height: 2.65rem; height: auto; border: 1px solid #4a4a63; border-radius: 4px; color: #e7e0eb; background: #0a0b15; transform: none; }.piano-keyboard > button:nth-of-type(n + 8) { z-index: 1; background: #211b29; }.signal-actions { grid-template-columns: 1fr; } }
</style>

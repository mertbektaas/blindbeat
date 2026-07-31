<script setup>
import { computed, ref, watch } from "vue";
import { usePlaybackStore } from "../stores/playback.store.js";
import { useVotingStore } from "../stores/voting.store.js";

const props = defineProps({
  gameState: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["intro-ready", "send-vote", "replay-variant"]);

const playbackStore = usePlaybackStore();
const votingStore = useVotingStore();
const introComplete = ref(false);
const introKey = ref(0);
const introMatchKey = ref(null);

const accentPalette = ["#c8f46b", "#c49aff", "#ff7599"];

const matchKey = computed(() => {
  return `${props.gameState?.sessionId ?? "session"}:${props.gameState?.currentMatchId ?? props.gameState?.matchNumber ?? "match"}`;
});

const isVoting = computed(() => votingStore.phase === "VOTING");
const hasSubmittedVote = computed(() => votingStore.voteSubmitted);

const variants = computed(() => {
  const variantsById = new Map(
    playbackStore.variants.map((variant) => [variant.id ?? variant.variantNo, variant])
  );

  const order = playbackStore.variantOrder.length > 0
    ? playbackStore.variantOrder
    : playbackStore.variants.map((variant) => variant.id ?? variant.variantNo);

  return order.map((id, index) => ({
    id,
    label: `Şarkı ${String(index + 1).padStart(2, "0")}`,
    accent: accentPalette[index % accentPalette.length],
    variant: variantsById.get(id) || null,
    index
  }));
});

const activeVariantIndex = computed(() => {
  const index = playbackStore.currentVariantIndex;
  return index >= 0 ? index : 0;
});

const activeAccent = computed(() => (
  variants.value[activeVariantIndex.value]?.accent || accentPalette[0]
));

function getVariantProgress(index) {
  const value = (playbackStore.progress * Math.max(variants.value.length, 1)) - index;
  return Math.min(Math.max(value, 0), 1);
}

function onIntroFinished(event) {
  if (event.target !== event.currentTarget || introComplete.value) {
    return;
  }

  introComplete.value = true;
  emit("intro-ready", {
    matchKey: matchKey.value
  });
}

function chooseVote(variantId) {
  votingStore.selectVariant(variantId);
}

function submitVote() {
  if (!votingStore.canVote || votingStore.selectedVariantId === null) {
    return;
  }

  emit("send-vote", votingStore.selectedVariantId);
}

function replaySong(songId) {
  if (playbackStore.songVariantPlaying !== null) {
    return;
  }
  emit("replay-variant", songId);
}

watch(matchKey, (nextKey) => {
  if (introMatchKey.value === nextKey) {
    return;
  }

  introMatchKey.value = nextKey;
  introComplete.value = false;
  introKey.value += 1;
}, { immediate: true });
</script>

<template>
  <main class="playback-pulse" :style="{ '--active-accent': activeAccent }">
    <div class="pulse-beams" aria-hidden="true"><i v-for="beam in 18" :key="beam"></i></div>

    <div
      v-if="!introComplete"
      :key="introKey"
      class="dj-intro"
      aria-hidden="true"
      @animationend="onIntroFinished"
    >
      <span>blind beat presents</span>
      <strong>ver bakalım<br>dj!</strong>
    </div>

    <section class="playback-stage" :class="{ ready: introComplete }">
      <header class="pulse-header">
        <span class="pulse-brand"><b>bb</b> blind beat</span>
      </header>

      <div class="pulse-title">
        <h1>ver bakalım dj!</h1>
        <h2>Üç ayrı ihtimal.<br>Tek bir favori.</h2>
      </div>

      <section class="playback-shell" aria-label="Şarkılar sırayla çalıyor">
        <div class="visual-stack" aria-hidden="true">
          <div class="pulse-orbit">
            <i v-for="ring in 5" :key="ring"></i>
            <b>{{ String(activeVariantIndex + 1).padStart(2, "0") }}</b>
          </div>
          <span>{{ playbackStore.phase === "PLAYBACK" ? "şimdi çalıyor" : "playback tamamlandı" }}</span>
        </div>

        <div class="track-column">
          <article
            v-for="song in variants"
            :key="song.id"
            class="track-row"
            :class="{
              active: !isVoting && song.index === activeVariantIndex,
              complete: isVoting || song.index < activeVariantIndex,
              replaying: isVoting && playbackStore.songVariantPlaying === song.id
            }"
            :style="{ '--track-accent': song.accent }"
          >
            <span class="track-index">0{{ song.index + 1 }}</span>
            <strong>{{ song.label }}</strong>
            <div class="track-progress"><i :style="{ width: `${getVariantProgress(song.index) * 100}%` }"></i></div>
            <button
              v-if="isVoting"
              type="button"
              class="track-replay"
              :disabled="playbackStore.songVariantPlaying !== null"
              @click.stop="replaySong(song.id)"
            >
              {{ playbackStore.songVariantPlaying === song.id ? "dinliyor" : "tekrar dinle" }}
            </button>
            <span class="track-state">
              {{ !isVoting && song.index === activeVariantIndex ? "çalıyor" : isVoting || song.index < activeVariantIndex ? "dinlendi" : "sırada" }}
            </span>
          </article>
        </div>
      </section>

      <section class="vote-zone" :class="{ open: isVoting }" aria-labelledby="vote-title">
        <template v-if="isVoting">
          <div class="vote-copy">
            <p>playback tamamlandı</p>
            <h2 id="vote-title">Hangisi hit?</h2>
          </div>

          <template v-if="!hasSubmittedVote">
            <div class="vote-options" role="radiogroup" aria-label="Şarkı seçimi">
              <button
                v-for="song in variants"
                :key="song.id"
                type="button"
                :class="{ selected: votingStore.selectedVariantId === song.id }"
                :style="{ '--vote-accent': song.accent }"
                @click="chooseVote(song.id)"
              >{{ song.label }}</button>
            </div>
            <button
              class="vote-submit"
              type="button"
              :disabled="votingStore.selectedVariantId === null"
              @click="submitVote"
            >Oyumu gönder</button>
          </template>

          <p v-else class="vote-locked">En iyisi bu demek?</p>
        </template>
      </section>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.playback-pulse { --ink:#f8f4f8; --muted:#a9a6b7; --line:#37344d; --panel:#121322; --lime:#c8f46b; --pink:#ff7599; position:relative; min-height:100vh; overflow:hidden; color:var(--ink); background:#090a10; font-family:"Space Grotesk",ui-sans-serif,system-ui,sans-serif; }
.pulse-beams { position:fixed; z-index:0; inset:0; display:flex; justify-content:space-around; align-items:center; padding:5vw; opacity:.3; pointer-events:none; }.pulse-beams i { width:1px; height:min(55vh,520px); background:#3d264e; box-shadow:0 0 22px #bd3c78; transform-origin:center; animation:sound-beam 2.8s ease-in-out infinite alternate; }.pulse-beams i:nth-child(3n) { height:28vh; background:#2d4b65; animation-delay:.3s; }.pulse-beams i:nth-child(4n) { height:72vh; background:#59335f; animation-delay:.7s; }.pulse-beams i:nth-child(5n) { height:18vh; animation-delay:1.1s; }
.dj-intro { position:fixed; z-index:8; inset:0; display:grid; place-content:center; text-align:center; pointer-events:none; animation:dj-intro-out 3s cubic-bezier(.2,.88,.2,1) forwards; }.dj-intro span { color:var(--lime); font-family:"DM Mono",monospace; font-size:clamp(.65rem,1.2vw,.82rem); letter-spacing:.16em; text-transform:uppercase; }.dj-intro strong { margin-top:.65rem; font-size:clamp(5rem,16vw,14rem); line-height:.7; letter-spacing:-.1em; text-shadow:7px 0 #762343,-7px 0 #262d76; }
.playback-stage { position:relative; z-index:1; width:min(1180px,calc(100% - 3rem)); margin:0 auto; padding:1.65rem 0 6rem; opacity:0; transform:translateY(1.5rem); pointer-events:none; }.playback-stage.ready { pointer-events:auto; animation:stage-arrive .7s cubic-bezier(.2,.86,.2,1) forwards; }
.pulse-header { display:flex; align-items:center; min-height:2.5rem; }.pulse-brand { display:inline-flex; align-items:center; gap:.45rem; color:var(--ink); font:.68rem "DM Mono",monospace; letter-spacing:.08em; text-transform:lowercase; }.pulse-brand b { display:grid; width:1.55rem; height:1.55rem; place-items:center; border:1px solid var(--lime); color:var(--lime); }
.pulse-title { margin:clamp(4rem,9vh,7rem) 0 clamp(2rem,5vh,4.5rem); }.pulse-title h1 { margin:0; color:var(--pink); font-size:clamp(3.2rem,6.5vw,6.2rem); line-height:.78; letter-spacing:-.085em; text-transform:lowercase; }.pulse-title h2 { max-width:530px; margin:1.25rem 0 0; font-size:clamp(2rem,4.3vw,4.1rem); line-height:.98; letter-spacing:-.075em; }
.playback-shell { display:grid; grid-template-columns:minmax(200px,.6fr) minmax(440px,1.4fr); gap:clamp(2rem,6vw,7rem); align-items:center; min-height:320px; padding:clamp(1rem,2.5vw,2rem); border:1px solid var(--line); background:rgb(17 18 33 / .74); box-shadow:14px 16px 0 rgb(0 0 0 / .2); }.visual-stack { display:grid; align-content:center; justify-items:center; min-height:260px; }.pulse-orbit { position:relative; display:grid; width:min(250px,100%); aspect-ratio:1; place-items:center; border:1px solid color-mix(in srgb,var(--active-accent) 50%,#3a3650); border-radius:50%; background:radial-gradient(circle,color-mix(in srgb,var(--active-accent) 18%,transparent),transparent 58%); }.pulse-orbit i { position:absolute; inset:13%; border:1px solid color-mix(in srgb,var(--active-accent) 52%,#47435d); border-radius:50%; animation:radar-ring 2.6s ease-out infinite; }.pulse-orbit i:nth-child(2){inset:24%;animation-delay:.3s}.pulse-orbit i:nth-child(3){inset:35%;animation-delay:.6s}.pulse-orbit i:nth-child(4){inset:46%;animation-delay:.9s}.pulse-orbit i:nth-child(5){inset:57%;animation-delay:1.2s}.pulse-orbit b { position:relative; z-index:2; font:clamp(3rem,6vw,5rem) "DM Mono",monospace; }.visual-stack>span { display:block; width:fit-content; margin:1rem auto 0; padding:.42rem .6rem; border:1px solid #49445b; color:var(--muted); background:#0b0c15; font:.58rem "DM Mono",monospace; letter-spacing:.12em; text-transform:uppercase; }
.track-column { display:grid; gap:.7rem; }.track-row { --track-accent:#c8f46b; display:grid; grid-template-columns:3.3rem minmax(9rem,1fr) minmax(8rem,1.8fr) auto 5.2rem; gap:1.1rem; align-items:center; min-height:5.4rem; padding:1rem 1.15rem; border:1px solid #35364d; color:var(--muted); background:#0b0c15; transition:.3s ease; }.track-row.active { border-color:var(--track-accent); color:var(--ink); background:color-mix(in srgb,var(--track-accent) 10%,#10111f); box-shadow:inset 4px 0 0 var(--track-accent); }.track-row.complete { opacity:.63; }.track-row.replaying { border-color:var(--track-accent); box-shadow:inset 4px 0 0 var(--track-accent),0 0 18px -4px var(--track-accent); animation:replay-pulse 1.4s ease-in-out infinite; }.track-index,.track-state { font:.64rem "DM Mono",monospace; }.track-progress { height:4px; overflow:hidden; background:#2e2e43; }.track-progress i { display:block; height:100%; background:var(--track-accent); transition:width 80ms linear; }.track-state { justify-self:end; text-transform:uppercase; }.track-replay { justify-self:end; min-width:7.5rem; min-height:2.4rem; padding:0 0.9rem; border:1px solid var(--track-accent); color:var(--track-accent); background:transparent; font:.6rem "DM Mono",monospace; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:.2s ease; }.track-replay:hover:not(:disabled) { color:#10111f; background:var(--track-accent); }.track-replay:disabled { cursor:not-allowed; opacity:.5; } @keyframes replay-pulse { 0%,100%{box-shadow:inset 4px 0 0 var(--track-accent),0 0 14px -6px var(--track-accent);} 50%{box-shadow:inset 4px 0 0 var(--track-accent),0 0 22px -2px var(--track-accent);} }
.vote-zone { display:grid; grid-template-columns:1fr; gap:1.15rem; max-height:0; margin-top:0; overflow:hidden; opacity:0; transform:translateY(1.4rem); transition:max-height .7s ease,margin .7s ease,opacity .5s ease,transform .7s ease; }.vote-zone.open { max-height:540px; margin-top:2.2rem; opacity:1; transform:translateY(0); }.vote-copy { display:flex; justify-content:space-between; align-items:end; }.vote-copy p { margin:0; color:var(--lime); font:.67rem "DM Mono",monospace; letter-spacing:.1em; text-transform:uppercase; }.vote-copy h2 { margin:0; font-size:clamp(2.2rem,5vw,4.3rem); line-height:.8; letter-spacing:-.06em; }.vote-options { display:grid; grid-template-columns:repeat(3,1fr); gap:.85rem; }.vote-options button { min-height:7.4rem; padding:1rem; border:1px solid #3c3c56; color:var(--ink); background:#111220; cursor:pointer; text-align:left; font:700 1.25rem "Space Grotesk",sans-serif; }.vote-options button:hover,.vote-options button.selected { border-color:var(--vote-accent); background:color-mix(in srgb,var(--vote-accent) 15%,#151621); box-shadow:inset 0 0 0 1px var(--vote-accent); }.vote-submit { justify-self:end; min-width:13rem; min-height:3.5rem; border:1px solid var(--lime); color:#12150d; background:var(--lime); cursor:pointer; font-weight:700; }.vote-submit:disabled { cursor:not-allowed; opacity:.3; }.vote-locked { margin:0; padding:1.2rem; border:1px solid var(--lime); color:var(--lime); font:.85rem "DM Mono",monospace; }
@keyframes sound-beam{to{filter:brightness(1.9);opacity:.45;transform:scaleY(.55)}}@keyframes dj-intro-out{0%,44%{opacity:0;transform:scale(.62)}55%,72%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-37vh) scale(.23)}}@keyframes stage-arrive{to{opacity:1;transform:translateY(0)}}@keyframes radar-ring{50%{opacity:.35;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
@media (max-width:760px){.playback-stage{width:calc(100% - 1.4rem);padding-bottom:4rem}.pulse-title{margin-top:4.5rem}.playback-shell{grid-template-columns:1fr;gap:1.5rem}.pulse-orbit{width:min(210px,58vw)}.visual-stack{min-height:180px}.track-row{grid-template-columns:2rem 1fr 4rem;gap:.55rem;min-height:4.7rem}.track-progress{grid-column:2 / -1}.track-state{grid-column:3;grid-row:1}.vote-copy{display:grid;gap:.6rem}.vote-options{grid-template-columns:1fr}.vote-options button{min-height:4.5rem}.vote-submit{width:100%}}
</style>

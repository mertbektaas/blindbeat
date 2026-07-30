<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  backendStatus: {
    type: String,
    default: "checking"
  },
  pending: Boolean,
  errorMessage: {
    type: String,
    default: ""
  },
  lobby: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["create-lobby", "join-lobby"]);

const mode = ref("create");
const nickname = ref("");
const roomCode = ref("");
const formMessage = ref("");

const readyLobbyCode = computed(() => props.lobby?.lobby?.code || "");

function chooseMode(nextMode) {
  mode.value = nextMode;
  formMessage.value = "";
}

function submitLobby() {
  const cleanNickname = nickname.value.trim();
  const cleanRoomCode = roomCode.value.trim().toUpperCase();

  if (!cleanNickname) {
    formMessage.value = "Önce bir takma ad lazım.";
    return;
  }

  if (mode.value === "join" && !cleanRoomCode) {
    formMessage.value = "Oda kodunu da alalım, kapıda kalmayalım.";
    return;
  }

  formMessage.value = "";

  if (mode.value === "create") {
    emit("create-lobby", { nickname: cleanNickname });
    return;
  }

  emit("join-lobby", {
    nickname: cleanNickname,
    lobbyCode: cleanRoomCode
  });
}
</script>

<template>
  <main class="landing-site">
    <nav class="landing-topbar" aria-label="Ana menü">
      <a class="landing-brand" href="#top" aria-label="Blind Beat ana sayfa">
        <span class="landing-brand-mark" aria-hidden="true">bb</span>
        <span>blind beat</span>
      </a>

      <div class="landing-nav-links">
        <a href="#nasil-oynanir">Nasıl oynanır</a>
        <a href="#lobi">Lobi</a>
      </div>

      <a class="landing-nav-cta" href="#lobi">Hemen başla</a>
    </nav>

    <section id="top" class="landing-hero">
      <div class="landing-hero-copy">
        <p :class="['landing-server-status', backendStatus]">
          {{ backendStatus === "online" ? "sistem açık" : "sistem kontrol ediliyor" }}
        </p>
        <h1>Blind<br>Beat</h1>
        <p class="landing-slogan">Yap. Kilitle. Dinle.</p>
        <a class="landing-primary-button" href="#lobi">Bir lobi kur</a>
      </div>

      <div class="landing-hero-art" aria-label="Sekiz adımlı müzik sequencer çizimi">
        <div class="landing-sticker landing-sticker-one">tap</div>
        <div class="landing-sticker landing-sticker-two">loop</div>
        <div class="landing-sequencer">
          <div class="landing-sequencer-topline">
            <span>blind beat / 08</span>
            <span class="landing-live-dot">● live</span>
          </div>
          <div class="landing-lane landing-lane-kick">
            <span>kick</span>
            <i v-for="step in 8" :key="`kick-${step}`" :class="{ lit: [1, 5].includes(step) }" />
          </div>
          <div class="landing-lane landing-lane-snare">
            <span>snare</span>
            <i v-for="step in 8" :key="`snare-${step}`" :class="{ lit: [3, 7].includes(step) }" />
          </div>
          <div class="landing-lane landing-lane-bass">
            <span>bass</span>
            <i v-for="step in 8" :key="`bass-${step}`" :class="{ lit: [2, 4, 8].includes(step) }" />
          </div>
          <div class="landing-lane landing-lane-lead">
            <span>lead</span>
            <i v-for="step in 8" :key="`lead-${step}`" :class="{ lit: [1, 4, 6].includes(step) }" />
          </div>
          <div class="landing-sequencer-footer">
            <span aria-hidden="true">▶</span>
            <span>8 step</span>
            <span>120 bpm</span>
          </div>
        </div>
      </div>
    </section>

    <section id="nasil-oynanir" class="landing-flow-section">
      <h2>Nasıl oynanır?</h2>
      <ol class="landing-flow-list">
        <li>
          <span>01</span>
          <div>
            <strong>Kendi pattern'ini yap</strong>
            <p>Sıradaki enstrüman için en iyi pattern'ini yap.</p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <strong>Mix and master</strong>
            <p>Tüm pattern'ler rastgele birleştirilir.</p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <strong>Dinle ve oyla!</strong>
            <p>Çıkan sonuçlardan en iyiyi seç.</p>
          </div>
        </li>
      </ol>
    </section>

    <section id="lobi" class="landing-launch-section">
      <div class="landing-launch-copy">
        <p>Odaya giriş</p>
        <h2>Masayı kur,<br>ekibi çağır.</h2>
      </div>

      <form class="landing-launch-panel" @submit.prevent="submitLobby">
        <template v-if="!readyLobbyCode">
          <div class="landing-mode-switch" role="group" aria-label="Lobi işlemi">
            <button
              type="button"
              :class="{ active: mode === 'create' }"
              @click="chooseMode('create')"
            >
              Oda oluştur
            </button>
            <button
              type="button"
              :class="{ active: mode === 'join' }"
              @click="chooseMode('join')"
            >
              Odaya katıl
            </button>
          </div>

          <label>
            Takma ad
            <input v-model="nickname" type="text" maxlength="24" placeholder="Örn. Mert" autocomplete="nickname">
          </label>

          <label v-if="mode === 'join'">
            Oda kodu
            <input
              v-model="roomCode"
              type="text"
              maxlength="4"
              placeholder="Örn. MSQ7"
              @input="roomCode = roomCode.toUpperCase()"
            >
          </label>

          <button class="landing-submit-button" type="submit" :disabled="pending">
            {{ pending ? "Bağlanıyor..." : mode === "join" ? "Odaya gir" : "Lobi kur" }}
          </button>

          <p v-if="formMessage || errorMessage" class="landing-form-notice error">
            {{ formMessage || errorMessage }}
          </p>
        </template>

        <div v-else class="landing-lobby-ready" aria-live="polite">
          <p>Lobi hazır</p>
          <strong>{{ readyLobbyCode }}</strong>
          <span>Ekibini bu kodla odaya çağır. Lobi ekranı sıradaki durak.</span>
        </div>
      </form>
    </section>

    <footer class="landing-footer">
      <span>blind beat</span>
      <span>birlikte yapılmış, kimsenin tek başına planlamadığı müzik</span>
    </footer>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.landing-site {
  --paper: #090a10;
  --ink: #f4eff5;
  --muted: #aaa5b7;
  --line: #2a2b40;
  --accent: #8b1e4a;
  --accent-dark: #cf3f75;
  --panel: #16152d;
  min-height: 100vh;
  overflow: hidden;
  color: var(--ink);
  background: var(--paper);
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}

.landing-site *, .landing-site *::before, .landing-site *::after { box-sizing: border-box; }
.landing-site a { color: inherit; text-decoration: none; }
.landing-topbar { display: flex; align-items: center; justify-content: space-between; max-width: 1220px; margin: 0 auto; padding: 1.25rem 2rem; }
.landing-brand { display: inline-flex; align-items: center; gap: 0.65rem; font-size: 1.05rem; font-weight: 700; letter-spacing: 0.02em; }
.landing-brand-mark { display: grid; width: 2rem; height: 2rem; place-items: center; border: 2px solid currentColor; border-radius: 7px; color: var(--accent-dark); font-family: "DM Mono", monospace; font-size: 0.7rem; transform: rotate(-5deg); }
.landing-nav-links { display: flex; gap: 1.6rem; color: var(--muted); font-size: 0.9rem; }
.landing-nav-links a:hover { color: var(--ink); }
.landing-nav-cta, .landing-primary-button, .landing-submit-button { display: inline-flex; min-height: 2.85rem; align-items: center; justify-content: center; border: 2px solid var(--ink); border-radius: 7px; padding: 0.75rem 1.1rem; color: var(--ink); background: var(--accent); box-shadow: 3px 3px 0 var(--ink); font: inherit; font-weight: 700; cursor: pointer; }
.landing-nav-cta:hover, .landing-primary-button:hover, .landing-submit-button:hover { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--ink); }
.landing-submit-button:disabled { cursor: wait; opacity: 0.7; }

.landing-hero { display: grid; grid-template-columns: minmax(280px, 0.78fr) minmax(420px, 1.22fr); align-items: center; gap: 3rem; max-width: 1220px; min-height: 680px; margin: 0 auto; padding: 3.5rem 2rem 5rem; }
.landing-hero-copy { position: relative; z-index: 1; max-width: 34rem; }
.landing-server-status { margin: 0 0 1rem; color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
.landing-server-status.online { color: #b7ed55; }
.landing-server-status::before { content: "● "; }
.landing-hero h1 { margin: 0; font-size: 7.2rem; line-height: 0.78; letter-spacing: 0; }
.landing-slogan { margin: 2rem 0 2.3rem; color: var(--muted); font-size: 1.15rem; }
.landing-hero-art { position: relative; min-height: 420px; }
.landing-sequencer { position: absolute; top: 2rem; right: 0; width: min(100%, 610px); padding: 1rem; border: 3px solid var(--ink); border-radius: 12px; background: var(--panel); box-shadow: 9px 9px 0 var(--ink); transform: rotate(2deg); }
.landing-sequencer-topline, .landing-sequencer-footer { display: flex; justify-content: space-between; gap: 1rem; color: var(--ink); font-family: "DM Mono", monospace; font-size: 0.72rem; }
.landing-sequencer-topline { padding-bottom: 0.75rem; border-bottom: 2px solid var(--ink); }
.landing-live-dot { color: var(--accent-dark); }
.landing-lane { display: grid; grid-template-columns: 4rem repeat(8, minmax(1.5rem, 1fr)); gap: 0.35rem; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid rgba(244, 239, 245, 0.25); }
.landing-lane > span { font-family: "DM Mono", monospace; font-size: 0.7rem; }
.landing-lane i { display: block; aspect-ratio: 1; border: 2px solid var(--ink); border-radius: 3px; background: transparent; }
.landing-lane i.lit { background: var(--accent); box-shadow: inset 0 0 0 3px var(--panel); }
.landing-sequencer-footer { padding-top: 0.85rem; }
.landing-sticker { position: absolute; z-index: 2; border: 2px solid var(--ink); border-radius: 50%; padding: 0.7rem 0.85rem; color: var(--ink); background: var(--accent); font-family: "DM Mono", monospace; font-size: 0.7rem; font-weight: 500; }
.landing-sticker-one { top: 0; left: 4%; transform: rotate(-12deg); }
.landing-sticker-two { right: 3%; bottom: 1.5rem; transform: rotate(9deg); background: var(--paper); }

.landing-flow-section, .landing-launch-section { max-width: 1220px; margin: 0 auto; padding: 5rem 2rem; border-top: 2px solid var(--line); }
.landing-flow-section h2, .landing-launch-copy h2 { margin: 0; font-size: 3rem; line-height: 0.98; letter-spacing: 0; }
.landing-flow-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin: 3rem 0 0; padding: 0; list-style: none; }
.landing-flow-list li { display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: start; padding-top: 1rem; border-top: 2px solid var(--ink); }
.landing-flow-list li > span { color: var(--accent-dark); font-family: "DM Mono", monospace; font-size: 0.8rem; }
.landing-flow-list strong { font-size: 1.1rem; }
.landing-flow-list p { margin: 0.55rem 0 0; color: var(--muted); line-height: 1.45; }

.landing-launch-section { display: grid; grid-template-columns: 1fr minmax(320px, 430px); gap: 4rem; align-items: start; padding-bottom: 6rem; }
.landing-launch-copy > p { margin: 0 0 1rem; color: var(--accent-dark); font-family: "DM Mono", monospace; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
.landing-launch-panel { display: grid; min-height: 20rem; gap: 1rem; padding: 1.25rem; border: 2px solid var(--ink); border-radius: 9px; background: rgba(22, 21, 45, 0.92); box-shadow: 6px 6px 0 var(--ink); }
.landing-mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.landing-mode-switch button { border: 2px solid var(--ink); border-radius: 6px; padding: 0.7rem; color: var(--ink); background: transparent; font: inherit; font-weight: 600; cursor: pointer; }
.landing-mode-switch button.active { color: var(--paper); background: var(--ink); }
.landing-launch-panel label { display: grid; gap: 0.4rem; color: var(--muted); font-size: 0.8rem; font-weight: 600; }
.landing-launch-panel input { width: 100%; border: 2px solid var(--ink); border-radius: 6px; padding: 0.75rem; color: var(--ink); background: var(--paper); font: inherit; outline: none; }
.landing-launch-panel input:focus { border-color: var(--accent-dark); }
.landing-form-notice { margin: 0; color: #ff90b4; font-size: 0.82rem; line-height: 1.4; }
.landing-lobby-ready { display: grid; place-content: center; min-height: 17rem; text-align: center; }
.landing-lobby-ready p, .landing-lobby-ready span { margin: 0; color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.76rem; line-height: 1.5; }
.landing-lobby-ready strong { margin: 0.6rem 0; color: var(--accent-dark); font-family: "DM Mono", monospace; font-size: clamp(3rem, 9vw, 5rem); letter-spacing: 0.08em; }

.landing-footer { display: flex; justify-content: space-between; gap: 1rem; max-width: 1220px; margin: 0 auto; padding: 1.5rem 2rem 6rem; color: var(--muted); font-family: "DM Mono", monospace; font-size: 0.7rem; }

@media (max-width: 760px) {
  .landing-topbar { padding: 1rem; }
  .landing-nav-links { display: none; }
  .landing-nav-cta { min-height: 2.4rem; padding: 0.55rem 0.75rem; font-size: 0.8rem; }
  .landing-hero { display: block; min-height: auto; padding: 3.5rem 1rem 5rem; }
  .landing-hero h1 { font-size: 5.2rem; }
  .landing-hero-art { min-height: 320px; margin-top: 3rem; }
  .landing-sequencer { top: 1rem; width: 100%; transform: rotate(1deg); }
  .landing-lane { grid-template-columns: 3.5rem repeat(8, minmax(1rem, 1fr)); gap: 0.22rem; }
  .landing-flow-section, .landing-launch-section { padding: 3.5rem 1rem; }
  .landing-flow-section h2, .landing-launch-copy h2 { font-size: 2.35rem; }
  .landing-flow-list, .landing-launch-section { grid-template-columns: 1fr; }
  .landing-launch-section { gap: 2rem; }
  .landing-footer { display: grid; padding: 1.5rem 1rem 3rem; }
}
</style>

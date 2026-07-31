<script setup>
import { computed, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from "vue";
import axios from "axios";
import * as Tone from "tone";
import { calculatePlaybackTiming } from "./audio/timing.js";
import { createAppAudioEngine } from "./audio/audio-engine.factory.js";
import { createPlaybackScheduler } from "./audio/playback-scheduler.js";
import { createPlaybackProgressTracker } from "./audio/playback-progress.js";
import PlaybackVotingPage from "./components/PlaybackVotingPage.vue";
import LeaderboardUpdatePage from "./components/LeaderboardUpdatePage.vue";
import SessionResultScreen from "./components/SessionResultScreen.vue";
import InstrumentRoundEditor from "./components/InstrumentRoundEditor.vue";
import { usePlaybackStore } from "./stores/playback.store.js";
import { useVotingStore } from "./stores/voting.store.js";
import { createPlaybackFlow } from "./audio/playback-flow.js";
import LandingPage from "./components/LandingPage.vue";
import LobbyPage from "./components/LobbyPage.vue";
import { createGameSocket } from "./realtime/game-socket.js";

const status = ref("checking");
const message = ref("Backend bağlantısı kontrol ediliyor...");
const audioStatus = ref("Ses sistemi hazır değil.");
const playbackStore = usePlaybackStore();
const votingStore = useVotingStore();
const gameStatus = ref("Bağlı değil.");
const gameState = ref(null);
const nickname = ref("");
const lobbyCode = ref("");
const lobbyStatus = ref("");
const lobbyData = ref(null);
const sessionStatus = ref("");
const landingActionPending = ref(false);
const landingActionError = ref("");
const currentScreen = ref("landing");
const gameRenderError = ref("");
const lobbySnapshot = ref(null);
const lobbyConnectionStatus = ref("Bağlanıyor...");
const lobbyReady = ref(false);
const lobbyLeaving = ref(false);
const sessionStarting = ref(false);
const lobbyStep = ref(0);
const lobbyPulseKey = ref(0);
const lobbyPatterns = ref([]);
const lobbyGameConfig = ref({
  bpm: 80,
  instrumentRoundSeconds: 30,
  stepCount: 16,
  maxMatchCount: 3
});

let audioEngine;
let playbackScheduler;
let progressTracker;
let playbackFlow;
let lastPlaybackReadyMatchKey = null;
let lastMatchNumber = null;
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";
let lobbySocket;
const lobbyVisualTimers = new Set();
let lobbyMusicTimer;
let lobbyLoopGeneration = 0;
let lobbyVisualGeneration = 0;
let lobbyCycleEndAt = 0;

const lobbyPlayers = computed(() => {
  const players = lobbySnapshot.value?.players || lobbyData.value?.lobby?.players || [];
  const selfPlayerId = lobbyData.value?.player?.id;
  const selfNickname = lobbyData.value?.player?.nickname;

  return players.map((player, index) => ({
    ...player,
    self: player.id === selfPlayerId || player.nickname === selfNickname,
    initials: getInitials(player.nickname),
    pulseColor: playerColor(player.nickname, index)
  }));
});

const lobbyIsHost = computed(() => {
  const hostPlayerId = lobbySnapshot.value?.hostPlayerId;
  const selfPlayerId = lobbyData.value?.player?.id;

  return hostPlayerId === undefined || hostPlayerId === null
    ? lobbyPlayers.value[0]?.self === true
    : hostPlayerId === selfPlayerId;
});

const lobbyPulseColor = computed(() => {
  const activeColors = lobbyPlayers.value
    .filter((_, index) => lobbyPatterns.value[index]?.[lobbyStep.value])
    .map(player => player.pulseColor);

  if (!activeColors.length) {
    return "transparent";
  }

  const channels = activeColors.map(hexToRgb).reduce(
    (total, color) => total.map((channel, index) => channel + color[index]),
    [0, 0, 0]
  ).map(channel => Math.round(channel / activeColors.length));

  return `rgb(${channels.join(", ")})`;
});

const instrumentScreenKey = computed(() => {
  return `${gameState.value?.matchNumber ?? "none"}:${gameState.value?.currentInstrumentCode ?? "none"}`;
});

onErrorCaptured((error, instance, info) => {
  console.error("GAME_RENDER_ERROR", { error, info });
  gameRenderError.value = error?.message || "Oyun ekranı oluşturulamadı.";
  return false;
});

function resetMatchPlaybackState() {
  playbackScheduler?.stop();
  progressTracker?.reset();

  playbackStore.$patch({
    phase: "IDLE",
    variants: [],
    variantOrder: [],
    songVariantPlaying: null,
    bpm: null,
    stepCount: null,
    playbackLoops: null,
    startAt: null,
    progress: 0,
    error: null
  });

  votingStore.reset();
}

async function checkBackend() {
  status.value = "checking";
  message.value = "Backend bağlantısı kontrol ediliyor...";

  try {
    const response = await axios.get(`${apiUrl}/health`, {
      withCredentials: true
    });

    status.value = response.data?.success ? "online" : "error";
    message.value = response.data?.success
      ? "Backend çalışıyor."
      : "Backend beklenen cevabı vermedi.";
  } catch (error) {
    status.value = "error";
    message.value = "Backend bağlantısı kurulamadı.";
  }
}

onMounted(checkBackend);

watch(lobbyPlayers, (players) => {
  syncLobbyPatterns(players);
}, { immediate: true });

watch(() => lobbyGameConfig.value.stepCount, () => {
  syncLobbyPatterns(lobbyPlayers.value);
  lobbyStep.value %= lobbyGameConfig.value.stepCount;
  void queueLobbyConfigRefresh();
});

watch(() => lobbyGameConfig.value.bpm, () => {
  void queueLobbyConfigRefresh();
});

onBeforeUnmount(() => {
  playbackFlow?.stop();
  lobbySocket?.close();
  stopLobbyMusic();
  audioEngine?.dispose();
});

function getInitials(name = "?") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function playerColor(name, index) {
  const palette = ["#b9285b", "#586ceb", "#b457cc", "#4ab5a0", "#e18b40", "#d34a8c"];
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return palette[(hash + index) % palette.length];
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map(offset => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

function createJamPattern(playerName, length) {
  const seed = [...playerName].reduce((total, character) => total + character.charCodeAt(0), 0);
  return Array.from({ length }, (_, index) => ((seed + index * 7) % 11) < 3);
}

function syncLobbyPatterns(players) {
  const length = lobbyGameConfig.value.stepCount;
  lobbyPatterns.value = players.map((player, index) => {
    const current = lobbyPatterns.value[index];

    if (current?.length === length) {
      return current;
    }

    return current
      ? Array.from({ length }, (_, stepIndex) => current[stepIndex] ?? false)
      : createJamPattern(player.nickname, length);
  });
}

function createLobbyAudioPattern(pattern, instrumentCode) {
  const notes = ["C3", "D#3", "F3", "G3", "A#3", "D4"];

  if (instrumentCode === "drums") {
    return {
      data: {
        steps: pattern.map((active, index) => ({
          kick: active && index % 4 === 0,
          snare: active && index % 4 === 2,
          hiHat: active
        }))
      }
    };
  }

  return {
    data: {
      steps: pattern.map((active, index) => active ? {
        note: notes[index % notes.length],
        velocity: 0.22
      } : null)
    }
  };
}

function stopLobbyMusic() {
  lobbyLoopGeneration += 1;
  lobbyVisualGeneration += 1;

  for (const timerId of lobbyVisualTimers) {
    window.clearTimeout(timerId);
  }

  lobbyVisualTimers.clear();
  window.clearTimeout(lobbyMusicTimer);
  lobbyMusicTimer = null;
  lobbyCycleEndAt = 0;
  lobbyStep.value = -1;
  audioEngine?.stop();
}

function scheduleLobbyVisualSteps({ startAtMs, stepDurationMs, stepCount, visualGeneration }) {
  function showStep(stepIndex) {
    if (visualGeneration !== lobbyVisualGeneration) {
      return;
    }

    const dueAt = startAtMs + stepIndex * stepDurationMs;
    const delay = Math.max(0, dueAt - performance.now());

    const timerId = window.setTimeout(() => {
      lobbyVisualTimers.delete(timerId);

      if (visualGeneration !== lobbyVisualGeneration) {
        return;
      }

      lobbyStep.value = stepIndex;
      lobbyPulseKey.value += 1;

      if (stepIndex + 1 < stepCount) {
        showStep(stepIndex + 1);
      }
    }, delay);

    lobbyVisualTimers.add(timerId);
  }

  showStep(0);
}

function scheduleLobbyMusicCycle({ generation, requestedStartAt } = {}) {
  if (
    generation !== lobbyLoopGeneration ||
    currentScreen.value !== "lobby" ||
    !audioEngine?.isInitialized()
  ) {
    return;
  }

  const timing = calculatePlaybackTiming({
    bpm: lobbyGameConfig.value.bpm,
    stepCount: lobbyGameConfig.value.stepCount,
    playbackLoops: 1
  });
  const startAt = Math.max(
    requestedStartAt ?? Tone.now() + 0.12,
    Tone.now() + 0.05
  );
  const instruments = ["drums", "bass", "chord-synth", "lead-synth"];
  const leadInMs = Math.max(0, (startAt - Tone.now()) * 1000);

  scheduleLobbyVisualSteps({
    startAtMs: performance.now() + leadInMs,
    stepDurationMs: timing.stepDurationSeconds * 1000,
    stepCount: lobbyGameConfig.value.stepCount,
    visualGeneration: lobbyVisualGeneration
  });

  lobbyPlayers.value.forEach((player, index) => {
    const pattern = lobbyPatterns.value[index];

    if (!pattern) {
      return;
    }

    audioEngine.previewPattern({
      pattern: createLobbyAudioPattern(pattern, instruments[index % instruments.length]),
      instrument: instruments[index % instruments.length],
      timing,
      startAt
    });
  });

  lobbyCycleEndAt = startAt + timing.totalDurationSeconds;

  lobbyMusicTimer = window.setTimeout(
    () => scheduleLobbyMusicCycle({ generation }),
    Math.max(50, timing.totalDurationSeconds * 1000 + 20)
  );
}

async function restartLobbyMusic() {
  if (!audioEngine?.isInitialized()) {
    return;
  }

  const generation = lobbyLoopGeneration + 1;
  lobbyLoopGeneration = generation;
  lobbyVisualGeneration += 1;

  for (const timerId of lobbyVisualTimers) {
    window.clearTimeout(timerId);
  }

  lobbyVisualTimers.clear();
  window.clearTimeout(lobbyMusicTimer);
  lobbyMusicTimer = null;
  lobbyCycleEndAt = 0;

  try {
    await audioEngine.resume();

    if (generation !== lobbyLoopGeneration || currentScreen.value !== "lobby") {
      return;
    }

    audioEngine.stop();
    scheduleLobbyMusicCycle({ generation });
  } catch (error) {
    audioStatus.value = `Lobi sesi başlatılamadı: ${error.message}`;
  }
}

function queueLobbyConfigRefresh() {
  if (
    currentScreen.value !== "lobby" ||
    !audioEngine?.isInitialized()
  ) {
    return;
  }

  const generation = lobbyLoopGeneration + 1;
  lobbyLoopGeneration = generation;
  window.clearTimeout(lobbyMusicTimer);

  const delay = Math.max(
    0,
    (lobbyCycleEndAt - Tone.now()) * 1000 + 20
  );

  lobbyMusicTimer = window.setTimeout(() => {
    scheduleLobbyMusicCycle({ generation });
  }, delay);
}

function disposeLobbyAudio() {
  playbackScheduler?.stop();
  playbackFlow?.stop();
  audioEngine?.dispose();

  audioEngine = undefined;
  playbackScheduler = undefined;
  progressTracker = undefined;
  playbackFlow = undefined;
}

async function prepareLobbyAudioFromGesture() {
  await prepareAudio();

  if (!audioEngine?.isInitialized()) {
    throw new Error("Ses sistemi hazırlanamadı.");
  }

  await audioEngine.resume();
}

    function applyLobbySnapshot(snapshot) {
  lobbySnapshot.value = {
    ...lobbySnapshot.value,
    ...snapshot,
    players: snapshot.players || lobbySnapshot.value?.players || []
  };

  if (snapshot.config) {
    lobbyGameConfig.value = {
      ...lobbyGameConfig.value,
      ...snapshot.config
    };
  }

  if (snapshot.patterns && snapshot.players) {
    lobbyPatterns.value = snapshot.players.map((player) => (
      snapshot.patterns[player.id]
        ? [...snapshot.patterns[player.id]]
        : createJamPattern(player.nickname, lobbyGameConfig.value.stepCount)
    ));
  }

  const selfPlayerId = lobbyData.value?.player?.id;
  lobbyReady.value = snapshot.players?.some((player) => (
    player.id === selfPlayerId && player.ready
  )) || false;

  if (snapshot.status === "IN_SESSION") {
    stopLobbyMusic();
    currentScreen.value = "game";
    void connectToGame();
    return;
  }

  void startSessionWhenEveryoneIsReady();
}

function connectLobbyRealtime() {
  lobbySocket?.close();
  lobbyConnectionStatus.value = "Canlı bağlantı kuruluyor...";

  lobbySocket = createGameSocket({
    url: wsUrl,
    onOpen: () => {
      lobbyConnectionStatus.value = "Canlı bağlantı açık";
    },
    onClose: () => {
      lobbyConnectionStatus.value = "Canlı bağlantı kapandı";
    },
    onError: () => {
      lobbyConnectionStatus.value = "Canlı bağlantı kurulamadı";
    },
    onMessage: (message) => {
      if (message?.type?.startsWith("lobby:")) {
        applyLobbySnapshot(message.payload || {});
      }
    }
  });

  lobbySocket.connect();
}

function enterLobby(result) {
  lobbySnapshot.value = result.lobby;
  currentScreen.value = "lobby";
  connectLobbyRealtime();
  void restartLobbyMusic();
}

function toggleLobbyReady() {
  if (!lobbySocket?.isOpen()) {
    return;
  }

  lobbySocket.send({
    type: "lobby:ready-update",
    requestId: crypto.randomUUID(),
    payload: { ready: !lobbyReady.value }
  });
}

async function startSessionWhenEveryoneIsReady() {
  const players = lobbySnapshot.value?.players || [];

  if (
    sessionStarting.value ||
    !lobbyIsHost.value ||
    players.length < 4 ||
    !players.every((player) => player.ready)
  ) {
    return;
  }

  sessionStarting.value = true;
  await startSession();
  sessionStarting.value = false;
}

function toggleLobbyStep(playerIndex, stepIndex) {
  const player = lobbyPlayers.value[playerIndex];

  if (!player?.self || !lobbySocket?.isOpen()) {
    return;
  }

  const pattern = [...lobbyPatterns.value[playerIndex]];
  pattern[stepIndex] = !pattern[stepIndex];
  lobbyPatterns.value[playerIndex] = pattern;

  lobbySocket.send({
    type: "lobby:pattern-update",
    requestId: crypto.randomUUID(),
    payload: { pattern }
  });
}

function updateLobbyConfig({ key, value }) {
  if (!lobbyIsHost.value || !lobbySocket?.isOpen()) {
    return;
  }

  lobbySocket.send({
    type: "lobby:config-update",
    requestId: crypto.randomUUID(),
    payload: { key, value }
  });
}

async function leaveLobbyFromPage() {
  const code = lobbyData.value?.lobby?.code;

  if (!code) {
    return;
  }

  lobbyLeaving.value = true;
  stopLobbyMusic();
  disposeLobbyAudio();

  try {
    await axios.delete(`${apiUrl}/lobbies/${code}/players/me`, {
      withCredentials: true
    });

    lobbySocket?.close();
    stopLobbyMusic();
    lobbyData.value = null;
    lobbySnapshot.value = null;
    lobbyReady.value = false;
    lobbyPatterns.value = [];
    currentScreen.value = "landing";
  } catch (error) {
    lobbyConnectionStatus.value = error.response?.data?.error?.message
      || "Lobiden çıkılamadı.";
    void prepareLobbyAudioFromGesture().then(restartLobbyMusic);
  } finally {
    lobbyLeaving.value = false;
  }
}

async function prepareAudio() {
  try {
    audioEngine ??= createAppAudioEngine();
    playbackScheduler ??= createPlaybackScheduler({ audioEngine });
    progressTracker ??= createPlaybackProgressTracker({
      onUpdate: ({ progress }) => {
        const variantCount = playbackStore.variantOrder.length;
        const variantIndex = playbackStore.currentVariantIndex;

        if (variantCount > 0 && variantIndex >= 0) {
          playbackStore.setProgress(
            (variantIndex + progress) / variantCount
          );
          return;
        }

        playbackStore.setProgress(progress);
      }
    });
    await audioEngine.initialize();
    await audioEngine.preload();
    playbackStore.markAudioReady();
    const diagnostics = audioEngine.getDiagnostics();
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";

    playbackFlow ??= createPlaybackFlow({
      apiUrl,
      wsUrl,
      playbackStore,
      votingStore,
      audioEngine,
      playbackScheduler,
      progressTracker,
      onOpen: () => {
        gameStatus.value = "Oyun bağlantısı açık.";
      },
      onClose: (event) => {
        const reason = event?.reason ? ` (${event.reason})` : "";
        gameStatus.value = `Oyun bağlantısı kapandı.${reason}`;
      },
      onError: (error) => {
        gameStatus.value = `Oyun akışında hata: ${error?.message || "Bilinmeyen hata"}`;
        console.error("GAME_FLOW_ERROR", error);
      },
      onGameState: (state) => {
        if (
          lastMatchNumber !== null &&
          state.matchNumber !== lastMatchNumber
        ) {
          resetMatchPlaybackState();
        }

        lastMatchNumber = state.matchNumber;
        gameState.value = state;

        if (state.phase !== "LOBBY") {
          stopLobbyMusic();
          currentScreen.value = "game";
        }

      }
    });

    audioStatus.value = `Ses sistemi hazır (${diagnostics.state}).`;
  } catch (error) {
    audioStatus.value = `Ses sistemi başlatılamadı: ${error.message}`;
    console.error(error);
  }
}

async function ensureAudioRunning() {
  if (!audioEngine) {
    await prepareAudio();
  }

  if (!audioEngine?.isInitialized()) {
    return false;
  }

  try {
    await audioEngine.resume();
    const diagnostics = audioEngine.getDiagnostics();

    if (diagnostics.state !== "running") {
      throw new Error(`AudioContext ${diagnostics.state} durumunda`);
    }

    return true;
  } catch (error) {
    audioStatus.value = `Ses sistemi çalıştırılamadı: ${error.message}`;
    console.error(error);
    return false;
  }
}

async function connectToGame() {
  if (!playbackFlow) {
    gameStatus.value = "Ses sistemi hazırlanıyor...";

    try {
      await prepareAudio();
    } catch (error) {
      gameStatus.value = "Ses sistemi hazırlanamadı.";
      console.error(error);
      return;
    }
  }

  try {
    playbackFlow.connect();
    gameStatus.value = "Oyun bağlantısı kuruluyor...";
  } catch (error) {
    gameStatus.value = "Oyun bağlantısı kurulamadı.";
    console.error(error);
  }
}

async function createLobby() {
  if (!nickname.value.trim()) {
    lobbyStatus.value = "Önce bir takma ad yaz.";
    return;
  }

  try {
    const response = await axios.post(
      `${apiUrl}/lobbies`,
      { nickname: nickname.value.trim() },
      { withCredentials: true }
    );

    lobbyData.value = response.data.data;
    lobbyCode.value = lobbyData.value.lobby.code;
    lobbyStatus.value = `Lobby hazır: ${lobbyCode.value}`;
  } catch (error) {
    lobbyStatus.value = error.response?.data?.error?.message || "Lobby oluşturulamadı.";
  }
}

async function joinLobby() {
  if (!nickname.value.trim() || !lobbyCode.value.trim()) {
    lobbyStatus.value = "Takma ad ve lobby kodu gerekli.";
    return;
  }

  try {
    const response = await axios.post(
      `${apiUrl}/lobbies/${lobbyCode.value.trim().toUpperCase()}/join`,
      { nickname: nickname.value.trim() },
      { withCredentials: true }
    );

    lobbyData.value = response.data.data;
    lobbyStatus.value = `Lobbyye katıldın: ${lobbyData.value.lobby.code}`;
  } catch (error) {
    lobbyStatus.value = error.response?.data?.error?.message || "Lobbyye katılınamadı.";
  }
}

async function createLobbyFromLanding({ nickname: landingNickname }) {
  landingActionPending.value = true;
  landingActionError.value = "";
  const audioPreparation = prepareLobbyAudioFromGesture();
  void audioPreparation
    .then(() => restartLobbyMusic())
    .catch((error) => {
      audioStatus.value = `Lobi sesi başlatılamadı: ${error.message}`;
    });

  try {
    const response = await axios.post(
      `${apiUrl}/lobbies`,
      { nickname: landingNickname },
      { withCredentials: true }
    );

    lobbyData.value = response.data.data;
    lobbyCode.value = lobbyData.value.lobby.code;
    lobbyStatus.value = `Lobi hazır: ${lobbyCode.value}`;
    enterLobby(lobbyData.value);
  } catch (error) {
    landingActionError.value = error.response?.data?.error?.message
      || "Lobi oluşturulamadı.";
  } finally {
    landingActionPending.value = false;
  }
}

async function joinLobbyFromLanding({ nickname: landingNickname, lobbyCode: landingLobbyCode }) {
  landingActionPending.value = true;
  landingActionError.value = "";
  const audioPreparation = prepareLobbyAudioFromGesture();
  void audioPreparation
    .then(() => restartLobbyMusic())
    .catch((error) => {
      audioStatus.value = `Lobi sesi başlatılamadı: ${error.message}`;
    });

  try {
    const response = await axios.post(
      `${apiUrl}/lobbies/${landingLobbyCode}/join`,
      { nickname: landingNickname },
      { withCredentials: true }
    );

    lobbyData.value = response.data.data;
    lobbyCode.value = lobbyData.value.lobby.code;
    lobbyStatus.value = `Lobiye katıldın: ${lobbyCode.value}`;
    enterLobby(lobbyData.value);
  } catch (error) {
    landingActionError.value = error.response?.data?.error?.message
      || "Lobiye katılınamadı.";
  } finally {
    landingActionPending.value = false;
  }
}

async function startSession() {
  const code = lobbyCode.value.trim().toUpperCase();

  if (!code) {
    sessionStatus.value = "Önce lobby kodu gerekli.";
    return;
  }

  try {
    const response = await axios.post(
      `${apiUrl}/lobbies/${code}/sessions`,
      {
        maxMatchCount: lobbyGameConfig.value.maxMatchCount,
        bpm: lobbyGameConfig.value.bpm,
        stepCount: lobbyGameConfig.value.stepCount,
        instrumentRoundSeconds: lobbyGameConfig.value.instrumentRoundSeconds,
        playbackLoops: 5,
        songVariantCount: 3,
        instrumentCodes: ["kick", "bass", "chord-synth"]
      },
      { withCredentials: true }
    );

    lobbyData.value = response.data.data;
    sessionStatus.value = "Session başladı. Oyun bağlantısı kuruluyor.";
    stopLobbyMusic();
    await connectToGame();
    currentScreen.value = "game";
  } catch (error) {
    sessionStatus.value = error.response?.data?.error?.message
      || "Session başlatılamadı.";
  }
}

function sendVote(songVariantId) {
  try {
    playbackFlow?.sendVote(songVariantId);
  } catch (error) {
    votingStore.setError(error.message);
  }
}

function handleReplayVariant(songVariantId) {
  try {
    playbackFlow?.replayVariant(songVariantId);
  } catch (error) {
    gameStatus.value = `Replay başlatılamadı: ${error.message}`;
  }
}

function continueAfterMatchResult() {
  try {
    playbackFlow?.sendMatchContinue();
    gameStatus.value = "Sonraki match için hazır sinyali gönderildi.";
  } catch (error) {
    gameStatus.value = `Hazır sinyali gönderilemedi: ${error.message}`;
  }
}

function handlePlaybackIntroReady({ matchKey }) {
  if (
    gameState.value?.phase !== "PLAYBACK" ||
    lastPlaybackReadyMatchKey === matchKey
  ) {
    return;
  }

  try {
    playbackFlow?.sendPlaybackReady();
    lastPlaybackReadyMatchKey = matchKey;
    gameStatus.value = "Playback için ses hazır.";
  } catch (error) {
    gameStatus.value = `Playback başlatılamadı: ${error.message}`;
  }
}

function sendPlayerReady() {
  try {
    playbackFlow?.sendPlayerReady();
    gameStatus.value = "Hazır sinyali gönderildi.";
  } catch (error) {
    gameStatus.value = error.message;
  }
}

function sendDraftUpdate(patternData) {
  try {
    playbackFlow?.sendDraftUpdate(patternData);
  } catch (error) {
    gameStatus.value = `Draft gönderilemedi: ${error.message}`;
  }
}

async function previewDraft(pattern) {
  if (!await ensureAudioRunning()) {
    return;
  }

  const timing = calculatePlaybackTiming({
    bpm: gameState.value?.bpm || 120,
    stepCount: pattern.stepCount,
    playbackLoops: 1
  });

  const instrument = gameState.value?.currentInstrumentCategory === "drums"
    ? "drums"
    : gameState.value?.currentInstrumentCode;

  if (!instrument) {
    audioStatus.value = "Preview için instrument bilgisi bekleniyor.";
    return;
  }

  try {
    audioEngine.stop();
    audioEngine.previewPattern({
      pattern,
      instrument,
      timing
    });
    audioStatus.value = "Draft preview çalıyor.";
  } catch (error) {
    audioStatus.value = `Preview çalınamadı: ${error.message}`;
  }
}

function lockDraft() {
  try {
    playbackFlow?.sendPatternLock();
    gameStatus.value = "Pattern kilitleme isteği gönderildi.";
  } catch (error) {
    gameStatus.value = `Pattern kilitlenemedi: ${error.message}`;
  }
}

async function playVariantPlaybackTest() {
  if (!await ensureAudioRunning()) {
    return;
  }

  audioEngine.stop();

  const timing = calculatePlaybackTiming({
    bpm: 120,
    stepCount: 8,
    playbackLoops: 1
  });

  const variants = [
    [true, false, false, false, true, false, false, false],
    [true, false, true, false, true, false, true, false],
    [false, true, false, true, false, true, false, true]
  ].map((kickSteps, variantIndex) => ({
    variantNo: variantIndex + 1,
    patterns: [
      {
        patternId: `frontend-test-${variantIndex + 1}`,
        instrumentId: "drums",
        instrumentCode: "drums",
        patternData: {
          steps: kickSteps.map((kick) => ({
            kick,
            snare: false,
            hiHat: true
          }))
        }
      }
    ]
  }));

  playbackStore.setVariants(variants);
  playbackStore.setPlaybackStart({
    variantOrder: [1, 2, 3],
    bpm: 120,
    stepCount: 8,
    playbackLoops: 1,
    startAt: null
  });

  const startAt = Tone.now() + 0.05;

  variants.forEach((variant, variantIndex) => {
    const variantStartAt = startAt + (
      variantIndex * timing.totalDurationSeconds
    );

    variant.patterns.forEach((patternEntry) => {
      audioEngine.previewPattern({
        pattern: {
          data: patternEntry.patternData
        },
        instrument: patternEntry.instrumentCode,
        timing,
        startAt: variantStartAt
      });
    });
  });

  progressTracker.start(timing.totalDurationSeconds * variants.length);
  audioStatus.value = "Üç davul varyantı sırayla çalıyor.";
}

async function playDrumTest() {
  if (!await ensureAudioRunning()) {
    return;
  }

  audioEngine.stop();

  const timing = calculatePlaybackTiming({
    bpm: 120,
    stepCount: 8,
    playbackLoops: 1
  });

  audioEngine.previewPattern({
    pattern: {
      data: {
        steps: [
          { kick: true, snare: false, hiHat: true },
          { kick: false, snare: false, hiHat: true },
          { kick: false, snare: true, hiHat: true },
          { kick: false, snare: false, hiHat: true },
          { kick: true, snare: false, hiHat: true },
          { kick: false, snare: false, hiHat: true },
          { kick: false, snare: true, hiHat: true },
          { kick: false, snare: false, hiHat: true }
        ]
      }
    },
    instrument: "drums",
    timing
  });

  audioStatus.value = "Davul testi çalıyor...";
  const measurement = await audioEngine.measureOutput();

  if (measurement.error) {
    audioStatus.value = `Ses ölçülemedi: ${measurement.error.message}`;
    return;
  }

  audioStatus.value = `Davul testi tamamlandı (sinyal: ${measurement.peak.toFixed(3)}).`;
}

function stopAudio() {
  progressTracker?.reset();
  playbackStore.reset();
  playbackScheduler?.stop();
  audioEngine?.stop();
  audioStatus.value = "Ses durduruldu.";
}
</script>

<template>
  <LandingPage
    v-if="currentScreen === 'landing'"
    :backend-status="status"
    :pending="landingActionPending"
    :error-message="landingActionError"
    :lobby="lobbyData"
    @create-lobby="createLobbyFromLanding"
    @join-lobby="joinLobbyFromLanding"
  />

  <LobbyPage
    v-else-if="currentScreen === 'lobby' && lobbyData?.lobby"
    :lobby="lobbyData.lobby"
    :players="lobbyPlayers"
    :patterns="lobbyPatterns"
    :current-step="lobbyStep"
    :pulse-color="lobbyPulseColor"
    :pulse-key="lobbyPulseKey"
    :is-ready="lobbyReady"
    :is-host="lobbyIsHost"
    :game-config="lobbyGameConfig"
    :connection-status="lobbyConnectionStatus"
    :audio-status="audioStatus"
    :leaving="lobbyLeaving"
    @toggle-ready="toggleLobbyReady"
    @toggle-step="toggleLobbyStep"
    @config-change="updateLobbyConfig"
    @leave-lobby="leaveLobbyFromPage"
  />

  <InstrumentRoundEditor
    v-if="currentScreen === 'game' && ['MATCH_STARTING', 'INSTRUMENT_ROUND'].includes(gameState?.phase)"
    :key="instrumentScreenKey"
    :game-state="gameState"
    @ready="sendPlayerReady"
    @draft-update="sendDraftUpdate"
    @preview="previewDraft"
    @lock="lockDraft"
  />

  <PlaybackVotingPage
    v-if="currentScreen === 'game' && ['PLAYBACK', 'VOTING'].includes(gameState?.phase)"
    :game-state="gameState"
    @intro-ready="handlePlaybackIntroReady"
    @send-vote="sendVote"
    @replay-variant="handleReplayVariant"
  />

  <LeaderboardUpdatePage
    v-if="currentScreen === 'game' && gameState?.phase === 'MATCH_RESULT'"
    :game-state="gameState"
    :api-url="apiUrl"
    @continue="continueAfterMatchResult"
  />

  <main v-if="currentScreen === 'game' && gameRenderError" class="game-fallback game-fallback-error">
    <p class="game-fallback-message">Oyun ekranı yüklenemedi: {{ gameRenderError }}</p>
  </main>

  <main v-else-if="currentScreen === 'game' && gameState?.phase === 'MATCH_BUILDING'" class="game-fallback">
    <p class="game-fallback-message">Varyantlar birleştiriliyor...</p>
    <p v-if="gameState?.matchBuildError" class="game-fallback-message">
      {{ gameState.matchBuildError.message }}
    </p>
  </main>

  <SessionResultScreen
    v-if="currentScreen === 'game' && gameState?.phase === 'SESSION_RESULT'
"
    :result="gameState?.sessionResult || votingStore.sessionResult"
  />

  <main v-else-if="currentScreen === 'game' && !['MATCH_STARTING', 'INSTRUMENT_ROUND', 'PLAYBACK', 'VOTING', 'MATCH_RESULT', 'SESSION_RESULT'].includes(gameState?.phase)" class="game-fallback">
    <p class="game-fallback-message">Bir sonraki ekran hazırlanıyor.</p>
  </main>

  <!-- Lobi ve oyun ekranları sonraki taşıma adımlarında bu shell'e bağlanacak. -->
  <main v-if="false" class="page-shell">
    <section class="status-panel" aria-live="polite">
      <p class="eyebrow">Blind Beat</p>
      <h1>Çalışma ortamı kontrolü</h1>
      <p :class="['status-message', status]">{{ message }}</p>
      <button type="button" @click="checkBackend">
        Yeniden kontrol et
      </button>
      <button type="button" @click="prepareAudio">
        Sesi hazırla
      </button>

      <div class="lobby-controls">
        <input
          v-model="nickname"
          placeholder="Takma ad"
          autocomplete="nickname"
        >
        <input
          v-model="lobbyCode"
          placeholder="Lobby kodu"
          maxlength="4"
          @input="lobbyCode = lobbyCode.toUpperCase()"
        >
        <div class="lobby-actions">
          <button type="button" @click="createLobby">
            Lobby oluştur
          </button>
          <button type="button" @click="joinLobby">
            Lobbyye katıl
          </button>
        </div>
        <p class="status-message">{{ lobbyStatus }}</p>
        <button type="button" @click="startSession">
          Session başlat
        </button>
        <p class="status-message">{{ sessionStatus }}</p>
      </div>

      <button type="button" @click="connectToGame">
        Oyuna bağlan
      </button>
      <button type="button" @click="playDrumTest">
        Davul testi
      </button>
      <button type="button" @click="playVariantPlaybackTest">
        Üç varyant testi
      </button>
      <button type="button" @click="stopAudio">
        Sesi durdur
      </button>
      <p class="status-message">{{ audioStatus }}</p>
      <p class="status-message">{{ gameStatus }}</p>
      <p v-if="gameState" class="status-message">
        Oyun fazı: {{ gameState.phase }}
      </p>
      <InstrumentRoundEditor
        :game-state="gameState"
        @ready="sendPlayerReady"
        @draft-update="sendDraftUpdate"
        @preview="previewDraft"
        @lock="lockDraft"
      />
      <SessionResultScreen :result="votingStore.sessionResult" />
    </section>
  </main>
</template>

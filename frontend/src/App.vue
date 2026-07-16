<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";

const status = ref("checking");
const message = ref("Backend bağlantısı kontrol ediliyor...");

async function checkBackend() {
  status.value = "checking";
  message.value = "Backend bağlantısı kontrol ediliyor...";

  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
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
</script>

<template>
  <main class="page-shell">
    <section class="status-panel" aria-live="polite">
      <p class="eyebrow">Blind Beat</p>
      <h1>Çalışma ortamı kontrolü</h1>
      <p :class="['status-message', status]">{{ message }}</p>
      <button type="button" @click="checkBackend">
        Yeniden kontrol et
      </button>
    </section>
  </main>
</template>

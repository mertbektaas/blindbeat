# Blind Beat – Teknik Özet

Bu belge, uygulanmış sistemin kısa teknik açıklamasıdır. Detaylı geliştirici rehberi için **[DEVELOPMENT.md](DEVELOPMENT.md)** dosyasına bakın.

## Mimari

```
Vue 3 + Vite (frontend)
        │  REST (kalıcı / tek seferlik) + WebSocket (canlı oyun)
        ▼
Node.js + Express + ws (backend)
        │  Prisma
        ▼
PostgreSQL 16
```

Event adı biçimi: `domain:action` (ör. `pattern:lock`). Canlı oyun state'inin, timer'ların, sıraların, oyların ve puanların tek otoritesi **sunucudur**.

## Teknoloji

- **Backend:** Node + Express 5 + native `ws` + Prisma + Zod
- **Frontend:** Vue 3 + Vite + Pinia + Tone.js + native WebSocket
- **Veritabanı:** PostgreSQL 16, pattern verisi JSONB

## REST API

`/api` prefix'i üzerinden:
- `POST /lobbies` – lobby oluştur
- `POST /lobbies/:code/join` – katıl
- `DELETE /lobbies/:code/players/me` – ayrıl
- `POST /lobbies/:code/sessions` – session başlat
- `POST /lobbies/rotate` – lobby döndür
- `GET /instruments` – enstrüman listele
- `GET /matches/:id/playback` ve `GET /matches/:id/leaderboard` – match verileri

## WebSocket

WebSocket canlı oyun olaylarını yönetir: odaya bağlanma, round/timer/reconnect, pattern lock, playback, oylama, leaderboard. Komutlar `{ type, requestId, payload }` zarfında gelir; sunucu gönderene **onay** döner, ilgili odalara **sınırlı yayın** yapar.

Guard katmanı her event'i sırayla denetler: session cookie → oyuncu → odaya aidiyet → game phase → sahiplik/yetki. İstemciden gelen playerId, roomId, puan, timer veya durum bilgisi yetki kaynağı sayılmaz.

## Oyun Durum Makinesi

Fazlar merkezi bir geçiş servisinde tanımlıdır:

```
LOBBY → INSTRUMENT_ROUND → PLAYBACK → VOTING → LEADERBOARD
LEADERBOARD → INSTRUMENT_ROUND | SESSION_RESULT | OG_ROUND
OG_ROUND → PLAYBACK | OG_ROUND | SESSION_RESULT
```

Bir event yalnızca mevcut faz buna izin veriyorsa işlenir.

## Gerçek Zamanlılık (Heartbeat ve Reconnect)

- Heartbeat: 5 sn ping, 3 sn pong bekleme, 2 kaçırılan ping → kopukluk.
- Reconnect countdownı = round süresi (30 sn); oyuncu match başına 2 kopma hakkına sahiptir.
- Bellek kayıtları: `ConnectionRegistry`, `SessionRegistry`, `RoomRegistry`.
- State senkronizasyonu delta eventler + `stateVersion`; istemci boşlukta snapshot ister.

## Veri Modeli (özet)

Ana entity'ler: `Lobby`, `Player`, `Session`, `SessionPlayer`, `SessionInstrument`, `Instrument`, `Match`, `Pattern`, `SongVariant`, `SongVariantPattern`, `Vote`, `SessionLeaderboard`.

- `Pattern` — `@@unique([playerId, matchId, instrumentId])`, `patternData Json`, `poolStatus` (ACTIVE/ARCHIVE/CONSUMED).
- `Session` — BPM, stepCount, round süresi, playback loop, song variant sayısı varsayılanlarını taşır.
- Pattern JSON: ortak zarf (`version`, `instrumentType`, `stepCount`) + enstrümana özel `data`.

## Eşzamanlılık ve Güvenilirlik

- Kalıcı işlemler tek transaction'da; tekrarlamayı engelleyen PostgreSQL unique constraint'ler.
- `requestId` bellekte kısa süre tutulur → tekrarlanan mesajlar ikinci kez işlenmez.
- Match sonu pattern seçimi `PatternPoolSnapshot` üzerinde yapılır (N+1 sorgu yok).
- Graceful shutdown: yeni bağlantı reddedilir, açık bağlantılar uyarılır, kaynaklar temizlenir.

## Yerleşim (frontend)

- `src/api/` – REST istemcileri
- `src/audio/` – ses motoru, playback zamanlama, `instrument-adapters`
- `src/realtime/` – WebSocket client + message handler'lar
- `src/stores/` – Pinia store'ları
- `src/components/` – ekran bileşenleri

## Genişletme

Oyun parametreleri `backend/src/config/game.config.js` üzerinden okunur. Yeni enstrüman: enstrüman kaydı + frontend ses adaptörü + pattern şeması/Zod doğrulama ekleyin.
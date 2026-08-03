# Blind Beat – Geliştirici Dokümanı

> Bu doküman, projeyi fork edip üzerinde geliştirecek bir geliştiricinin ihtiyaç duyacağı bilgilerin tek ve güncel kaynağıdır. Oyun kuralları, teknik mimari, veri modeli, çalıştırma adımları, gerçek zamanlı protokol ve genişletme noktaları burada toplu halde bulunur.

## İçindekiler

- [1. Proje Nedir](#1-proje-nedir)
- [2. Oyun Özeti ve Kuralları](#2-oyun-ozeti-ve-kurallari)
- [3. Teknoloji Yığını](#3-teknoloji-yigini)
- [4. Repo Yapısı](#4-repo-yapisi)
- [5. Geliştirme Ortamı](#5-gelistirme-ortami)
- [6. Ortam Değişkenleri](#6-ortam-degiskenleri)
- [7. Mimari Genel Bakış](#7-mimari-genel-bakis)
- [8. Backend Katmanları](#8-backend-katmanlari)
- [9. Veri Modeli](#9-veri-modeli)
- [10. Oyun Durum Makinesi](#10-oyun-durum-makinesi)
- [11. REST ve WebSocket Görev Ayrımı](#11-rest-ve-websocket-gorev-ayrimi)
- [12. Gerçek Zamanlı İletişim](#12-gercek-zamanli-iletisim)
- [13. Oyun Akışı](#13-oyun-akisi)
- [14. Ses ve Playback](#14-ses-ve-playback)
- [15. Güvenilirlik ve Yarış Durumları](#15-guvenilirlik-ve-yaris-durumlari)
- [16. Genişletme Noktaları ve Config](#16-genisletme-noktalari-ve-config)
- [17. Test Stratejisi](#17-test-stratejisi)
- [18. MVP Sınırları](#18-mvp-sinirlari)
- [19. Dosya / Dizin Referansı](#19-dosya--dizin-referansi)

---

## 1. Proje Nedir

Blind Beat, oyuncuların diğerlerinin katkılarını duymadan **müzik pattern'leri** oluşturduğu çok oyunculu bir müzik oyunudur. Sistem, oyuncu katkılarını birleştirerek **üç farklı şarkı varyantı** üretir; oyuncular bu şarkıları anonim olarak dinleyip oylayarak puan kazanır.

Oyun "blind" (kör) prensibi üzerine kuruludur: katkılar görülmeden oluşturulur, rastgele birleştirilir, kör olarak oylanır ve sonuç oylamadan sonra açıklanır.

---

## 2. Oyun Özeti ve Kuralları

Bu bölüm MVP davranışını özetler. Karar gerekçeleri `game.md` tasarım kaydında arşivlidir; aşağıdakiler **uygulanan kuralların** güncel halidir.

### 2.1 Lobby ve Oturum (Session)

- Bir **lobby** 4–10 oyuncuyla kurulur.
- Bir **session**, lobby içinde art arda oynanacak toplam match sayısıdır (maks 5).
- Lobby kodu sunucu tarafında üretilir. Hesap/yetkinlendirme yoktur; oyuncu **nickname** ile katılır, kimliği bir session cookie ile tutulur.
- Nickname aynı lobby içinde **benzersiz** olmalıdır.
- Session başlayınca lobby kilitlenir; yeni oyuncu alınmaz, yalnızca mevcut oyuncular reconnect edebilir.
- En az 4 oyuncu olmadan session başlatılamaz; oyuncu eklenir/ayrılırsa uygunluk koşulları yeniden hesaplanır.

### 2.2 Enstrümanlar ve Instrument Round

Aday enstrüman havuzu (bir match için en fazla **6** enstrüman seçilir):
Kick/Drum, Snare/Percussion, Hi-hat, Bass, Chord Synth, Lead Synth, Electric Guitar.

- Her **instrument round** tek bir enstrümana ayrılır ve **30 saniye** sürer.
- O round içinde **tüm oyuncular** aynı anda 8-step grid üzerinde kendi pattern'ini üretir.
- Oyuncular birbirlerinin pattern'lerini ve önceki katkıları görmez / duymaz.
- Round süresi dolunca veya oyuncu LOCK verirse pattern havuza kaydedilir.

### 2.3 Pattern Pool ve Archive

- Her enstrümanın ayrı bir **pattern pool'u** vardır.
- Aktif havuz limiti **50 pattern**. Limit aşılırsa pattern silinmez, **archive** alanına taşınır.
- Seçilen pattern normal akışta havuzdan çıkarılır ve tekrar kullanılmaz.
- Seçilmeyen pattern'ler sonraki match'lere aktarılır.
- Archive pattern'leri yalnızca OG Round'da kullanılır.

### 2.4 Üç Şarkının Üretilmesi

- Tüm kombinasyonlar hesaplanmaz; her enstrüman havuzundan **3 pattern** seçilir.
- Bu 3 pattern enstrüman bazında karıştırılarak 3 **song variant**'a dağıtılır (ör. `Song 1 = G1 + H3 + D2`).
- Katmanlar elenmez; yalnızca hangi oyuncunun pattern'inin kullanıldığı değişir.
- Her şarkı, match'te seçilen tüm enstrüman katmanlarını içerir.

### 2.5 Fairness (Oyuncu Temsili)

- Toplam temsil kapasitesi: `3 x seçilen enstrüman sayısı`.
- Her oyuncunun en az bir şarkıda temsil edilmesi garanti edilir (minimum temsil; bir oyuncunun birden fazla pattern'i seçilebilir).
- Lobby geçerlilik kuralı: `3 x enstrüman sayısı >= oyuncu sayısı`.

| Oyuncu | Minimum enstrüman | Slot kapasitesi |
|---:|---:|---:|
| 4–6 | 2 | 6 |
| 7–9 | 3 | 9 |
| 10 | 4 | 12 |

- **Ağırlıklı rastgele seçim:** yeni (current match) pattern `x1.20`, eski (archive) pattern `x1.00` ağırlığındadır. Bu katsayı oyuncu puanını değil, seçilme olasılığını etkiler.
- Düşük puanlı oyuncuya yapay avantaj verilmez.

### 2.6 Playback ve Oylama

- Her şarkı **5 loop** çalar; 8-step ve 120 BPM varsayımında bir loop yaklaşık 2 sn, 5 loop yaklaşık 10 sn.
- Üç şarkı **rastgele sırayla** oynatılır; sırayı sunucu belirler ve herkese aynı sırayla gönderilir.
- Playback ve oylama sırasında pattern, oyuncu adı ve oy sayısı **gizlidir**.
- Ekranda yalnızca üç progress bar gösterilir.
- Üç playback tamamlanmadan oylama başlamaz.
- Oyuncu pattern'e değil, bütün şarkıya oy verir.
- Oylama kapanınca anonim kodlar gerçek oyuncu isimlerine dönüştürülür.

### 2.7 Puanlama

- Tek kazanan şarkı varsa, kazanan şarkıda pattern'i bulunan her **benzersiz oyuncu** 1 puan alır.
- Aynı oyuncunun kazanan şarkıda birden fazla pattern'i varsa normal kazançta yine yalnızca 1 puan.
- Tüm oylar tek şarkıya giderse kazanan şarkının sahipleri **x2** puan alır (oyuncu başına, pattern başına değil).
- En yüksek oyta iki/üç şarkı berabere kalırsa yalnızca berabere kalan şarkılar puanlanır; bu şarkılarda oyuncunun kaç pattern'i seçildiyse o kadar puan alır.
- Leaderboard her match sonunda güncellenir.

### 2.8 Tiebreaker – OG Round

- Session sonundaki en yüksek skorda beraberlik varsa **OG Round** başlar.
- Yalnızca berabere kalanlar yarışçıdır; her biri için yalnızca **kendi archive pattern'lerinden** bir şarkı üretilir.
- 2 yarışçı → 2 şarkı; 3 yarışçı → 3 şarkı.
- Normalde yarışçılar oy veremez; diğer lobby oyuncuları oy verir.
- Tümü berabere kaldıysa fallback: yarışçılar **rakiplerinin** şarkısına oy verir, kendi şarkısına veremez.
- Beraberlik bitene kadar archive'dan farklı pattern'lerle tekrarlanır.

### 2.9 Reconnect Kuralları

- Reconnect countdown = instrument round süresi (**30 sn**).
- Oyuncu bir match içinde **en fazla 2 kez** kopabilir; 3. kopuşta o round katkısı pas geçilir.
- Reconnect sayacı her match başında sıfırlanır; ilk katılım sayılmaz.
- Dönen oyuncuya o round için tam 30 saniye verilir; diğerlerinin deadline'ı değişmez.
- Katkısı pas geçilen oyuncu sonraki round'lara katılmaya devam eder.

---

## 3. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Vue 3 + Vite + Pinia, Tone.js (ses), native WebSocket |
| Backend | Node.js + Express 5, native `ws`, Zod (doğrulama) |
| Veritabanı | PostgreSQL 16 + Prisma ORM (pattern verisi JSONB) |
| Test | Jest + Supertest |
| Orkestrasyon | Docker Compose |

---

## 4. Repo Yapısı

```
blindbeat/
├── backend/                 # Node + Express + WebSocket sunucusu
│   ├── prisma/              # Şema, migrationlar, seed
│   └── src/
│       ├── app.js           # Express fabrikası (CORS, router, hata)
│       ├── server.js         # Giriş noktası (HTTP + WebSocket)
│       ├── config/          # Oyun sabitleri
│       ├── controllers/     # REST handler'lar
│       ├── routes/          # REST rotaları
│       ├── services/        # İş kuralları
│       ├── repositories/    # Prisma erişim katmanı
│       ├── realtime/        # WebSocket: bağlantı, room, broadcast, heartbeat
│       ├── game/            # State machine, round, puanlama, OG, playback
│       ├── validation/      # Zod şemaları
│       ├── errors/          # Domain hata modelleri
│       ├── cookies/         # Session cookie işlemleri
│       ├── registries/      # Bellek içi kimlik/registry
│       └── utils/           # Yardımcılar (lobby kodu vb.)
├── frontend/                # Vue 3 + Vite client
│   └── src/
│       ├── api/             # REST istemcileri
│       ├── audio/           # Ses motoru, adapters, playback zamanlama
│       ├── realtime/        # WebSocket client + message handler'lar
│       ├── stores/          # Pinia store'ları
│       └── components/      # Ekran bileşenleri
├── docs/                    # Geliştirici ve tasarım dokümanları
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Geliştirme Ortamı

Tek gereksinim **Docker**. Backend, frontend ve PostgreSQL ayrı servislerdir; kod container'lara volume olarak bağlanır ve hot reload kullanılır.

```bash
cp .env.example .env   # kendi local değerlerini yaz
docker compose up -d --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Container başlangıcında `prisma migrate deploy` ve `prisma/seed.js` otomatik çalışır.

---

## 6. Ortam Değişkenleri

`.env` Git'te ignore edilir; yalnızca `.env.example` sürümlenir. Temel değişkenler:

| Değişken | Açıklama |
|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Veritabanı kimlik bilgileri |
| `DATABASE_URL` | Prisma bağlantı dizesi |
| `BACKEND_PORT` / `FRONTEND_PORT` | Harici portlar (compose) |
| `SESSION_SECRET` | Cookie imzalama |
| `FRONTEND_ORIGIN` | CORS izinli frontend adresi |
| `VITE_API_URL` / `VITE_WS_URL` | Frontend'in API/WS adresleri |

---

## 7. Mimari Genel Bakış

```
Vue 3 + Vite (frontend)
        │  REST (kalıcı / tek seferlik) + WebSocket (canlı)
        ▼
Node / Express / ws (backend)
        │  Prisma
        ▼
PostgreSQL (kalıcı)   +   Bellek registry'leri (canlı oyun state)
```

**Canlı vs kalıcı veri ayrımı:**

- **Bellek (sunucu):** oda ve lobby registry, WebSocket bağlantıları, aktif faz/timer, player bağlantı durumu, geçici pattern taslakları, reconnect sayaçları, playback/oylama durumu, requestId geçmişi.
- **PostgreSQL:** lobby, session, match, player, instrument, pattern (JSONB), song variant, oylar, leaderboard.

**Tek otorite:** Oyun state'inin, timer'ların, turn sırasının, oyların ve puanların tek sahibi **sunucudur**. İstemciden gelen `playerId`, `roomId`, puan, timer veya oyun durumu bilgisi yetki kaynağı olarak kabul edilmez.

---

## 8. Backend Katmanları

Veri akışı en dıştan içe:

```
Controller / WebSocket event  →  Service  →  Repository  →  Prisma  →  PostgreSQL
```

- **Controllers / routes:** REST endpoint tanımları ve istek-response arası geçiş.
- **Services:** İş kuralları, transaction koordinasyonu, oyun akışı.
- **Repositories:** Tüm Prisma/database erişimi burada; controller veya WS handler'da Prisma kullanılmıyorolur.
- **Game modülü:** State machine geçişleri, round yönetimi, pattern seçimi, puanlama, OG round, playback koordinasyonu, reconnect.
- **Realtime modülü:** WebSocket bağlantı kurulumu, room registry, broadcast, heartbeat, origin doğrulama, requestId izleme.
- **Validation:** Zod şemaları (frontend ve backend aynı kuralları hedefler).

Katmanlar fabrika fonksiyonu enjeksiyonu ile yazılır (ör. `createApp({ lobbyRoutes, playbackRoutes, ... })`), bu da test edilebilirliği artırır.

---

## 9. Veri Modeli

Yalnızca `backend/prisma/schema.prisma` referans alınır. Kalıcı kimlikler integer (`id`), dışarıya açılır kimlikler UUID / lobby kodu.

Ana tablolar:

- **Lobby** — `code` unique, `status`
- **Player** — lobby'ye aittir; `@@unique([lobbyId, nickname])`
- **Session** — `maxMatchCount`, bpm, stepCount, instrumentRoundSeconds, playbackLoops, songVariantCount
- **SessionPlayer** — session ↔ player bağlantıları
- **SessionInstrument** — session için sıralı enstrümanlar
- **Instrument** — kod, ad, kategori, `enabled`
- **Match** — `@@unique([sessionId, matchNumber])`
- **Pattern** — `@@unique([playerId, matchId, instrumentId])`, `patternData Json`, `poolStatus`
- **SongVariant** — `@@unique([matchId, variantNo])`
- **SongVariantPattern** — hangi pattern'in hangi şarkıda hangi enstrüman slotunda olduğu
- **Vote** — `@@unique([matchId, playerId])`
- **SessionLeaderboard** — session ↔ player toplam skor

`poolStatus` enum: `ACTIVE` / `ARCHIVE` / `CONSUMED`.

**Pattern JSON yapısı** — ortak zarf + enstrümana özel `data`:

```json
{
  "version": 1,
  "instrumentType": "bass",
  "stepCount": 8,
  "data": { "steps": ["C2", null, "E2", null] }
}
```

- `stepCount` verinin içine gömülmez, ayrı alandan okunur → ileride 16-step, şema değişmeden eklenebilir.
- Pattern'ler Match kaydına gömülmez; bağımsız kayıtlardır ve Repository/Service ilişkileri kurar.

---

## 10. Oyun Durum Makinesi

Fazlar merkezi bir geçiş servisi ile yönetilir; harici kütüphane yok.

**Fazlar:** `LOBBY`, `INSTRUMENT_ROUND`, `PLAYBACK`, `VOTING`, `LEADERBOARD`, `OG_ROUND`, `SESSION_RESULT`.

**Geçerli geçişler:**

```
LOBBY ─────────────────→ INSTRUMENT_ROUND
INSTRUMENT_ROUND ──────→ PLAYBACK
PLAYBACK ──────────────→ VOTING
VOTING ────────────────→ LEADERBOARD
LEADERBOARD ───────────→ INSTRUMENT_ROUND | SESSION_RESULT | OG_ROUND
OG_ROUND ──────────────→ OG_ROUND | SESSION_RESULT
```

Bir WebSocket event'i yalnızca mevcut faz izin veriyorsa işlenir. Örneğin VOTING fazında pattern lock isteği reddedilir.

---

## 11. REST ve WebSocket Görev Ayrımı

**REST API** (kalıcı / tek seferlik kaynak işlemleri), `/api` prefix'i altında:
- Lobby oluşturma, katılma, ayrılma, session başlatma
- Lobby rotate (`POST /lobbies/rotate`)
- Instrument listeleme
- Match playback ve leaderboard getirme

**WebSocket** (canlı oyun olayları):
- Oyuncu katılım / ayrılış
- Instrument round başlangıcı, timer, reconnect
- Pattern kilitleme
- Playback başlatma / tamamlama
- Oylama başlangıcı / bitişi
- Leaderboard güncellemesi

Kural: Kalıcı bir kaynak işlemi → REST; oyun sırasındaki canlı olay → WebSocket. Pattern lock ve oy verme REST endpoint'i değil, WebSocket üzerinden gider; geçmiş veri sorguları REST'ten yapılır.

---

## 12. Gerçek Zamanlı İletişim

### 12.1 Mesaj Zarfı

Tüm mesajlar ortak JSON zarf: `{ "type", "requestId", "payload" }`. Event adları `domain:action` biçimindedir (ör. `pattern:lock`, `playback:start`).

### 12.2 Komut → Onay → Yay

1. İstemci komut + `requestId` gönderir.
2. Sunucu yetki / faz / format doğrular; yalnızca gönderene **onay** veya hata döner.
3. Room ilgileniliyorsa **sınırlı yayın** yapılır (ör. sadece `pattern:locked` + anonim bilgi).
4. Sunucu tüm room state'ini her seferinde göndermez; yalnızca gereken minimum bilgi.

### 12.3 Ortak Cevap / Hata Formatı

```json
{ "success": true,  "data": { "accepted": true }, "error": null,                      "requestId": "req-123" }
{ "success": false, "data": null, "error": { "code": "PATTERN_ALREADY_LOCKED", "message": "..." }, "requestId": "req-123" }
```

`code` makine değeri (frontend karar noktaları için), `message` log / kullanıcı için.

### 12.4 Guard Katmanı (Yetkilendirme)

Her event şu sırayla denetlenir:
1. Mesaj formatı / payload doğrulanır.
2. Session cookie → bağlantının oyuncusu bulunur.
3. Oyuncunun o room'a ait olduğu kontrol edilir.
4. Mevcut game phase event'e izin veriyor mu?
5. Sahiplik / yetki kontrol edilir.
6. Event handler yalnızca iş mantığını çalıştırır.

### 12.5 Reconnect (sunucu tarafı)

Bellek registry'leri üzerinden çalışır:
- `ConnectionRegistry: socket → sessionId`
- `SessionRegistry: sessionId → { roomId, playerId, nickname, status }`
- `RoomRegistry: roomId → RoomState`

Reconnect'te yeni socket aynı session'a bağlanır; countdown biterse round katkısı kural gereği pas geçilir.

### 12.6 Heartbeat

- Ping-pong: 5 sn ping aralığı, 3 sn pong bekleme, 2 kaçırma → bağlantı kopuk kabul edilir.
- Normal `close` event'i gelirse heartbeat beklenmeden countdown başlar.

### 12.7 State Senkronizasyonu

Delta event'leri bir `stateVersion` ile birlikte gelir. İstemci kendi sürümü ile gelen eventi karşılaştırır; arada boşluk varsa filtrelenmiş snapshot ister. Snapshot yalnızca o oyuncunun o fazda görebileceği bilgiyi içerir.

---

## 13. Oyun Akışı

```
Match başlar
  → her enstrüman için INSTRUMENT_ROUND (tüm oyuncular pattern üretir)
  → pattern'ler havuzlara kaydedilir
  → her enstrümandan 3 pattern seçilir + 3 song variant kurulur (fairness + ağırlıklı)
  → PLAYBACK (3 şarkı rastgele sırayla, 5 loop)
  → VOTING (oyuncular bir şık)
  → puanlar hesaplanır → LEADERBOARD güncellenir
  → sonraki match | OG_ROUND | SESSION_RESULT
```

**Snapshot yaklaşımı:** Round'lar sırasında pattern'ler yalnızca kaydedilir. Tüm round'lar bitince `PatternPoolRepository` tek bir toplu sorguyla current + archive pattern'ini, sahibini, enstrümanını ve pool durumunu alıp bellekte `PatternPoolSnapshot` kurar. Seçim, fairness ve 3 song variant bu snapshot üzerinde çalışır; sonra tek bir transaction içinde pool durumları güncellenir ve şarkılar yazılır. Bu sayede N+1 sorgu problemi oluşmaz.

---

## 14. Ses ve Playback

- Sunucu **ses render etmez**; pattern referanslarını, BPM'i, playback sırasını, fazı ve başlangıç zaman damgasını yönetir.
- İstemci, Tone.js / Web Audio üzerinde sesi kendi yerel clock'una planlar.
- Kick / snare / hi-hat / bass / chord / lead **sentez**; **elektro gitar gerçek kayıt assetleri** ile (6 telli, tel kesişmesi → nota).
- Eşzaman: istemci `playback:ready` gönderir → sunucu ortak başlangıç zamanı yayınlar → tüm katmanlar aynı audio clock'tan başlar.
- İstemciler arasında sample-hassasiyetinde senkron hedeflenmez; her oyuncunun kendi cihazında katmanların birlikte çalması yeterlidir.

---

## 15. Güvenilirlik ve Yarış Durumları

Dört katmanlı koruma:
1. Basit işlemlerde önce server state kontrolü.
2. Kalıcı işlemler transaction içinde.
3. Tekrarlamayı engelleyen PostgreSQL unique constraint'leri (ör. `player + match + instrument`).
4. Aynı slotun iki işlemde seçilebileceği kritik alanlarda satır kilidi.

- Tekrarlanan WebSocket mesajları için `requestId` bellekte kısa süre tutulur; aynı requestId ikinci kez gelirse işlem yeniden yürütülmez, önceki onay/hata döner.
- Match sonu seçim ve oylama/puanlama ayrı ayrı tek transaction içinde.
- **Graceful shutdown:** yeni bağlantı reddedilir, aktif bağlantılara kapan bilgisi gönderilir, timer/registry temizlenir, ardından DB bağlantıları kapatılır.

---

## 16. Genişletme Noktaları ve Config

`backend/src/config/game.config.js` oyun parametrelerinin tek yeridir:

- `defaultBpm`, `defaultStepCount`, `instrumentRoundSeconds`
- `playbackLoops`, `songVariantCount`, `playbackStartDelayMs`
- `unanimousVoteMultiplier`, `minPlayers`, `maxPlayers`, `maxMatchCount`
- `maxActivePatternCount`, `websocketMaxPayloadBytes`, `requestIdHistoryPerPlayer`

Katsayılar ve havuz/oyun parametreleri config üzerinden okunur (sabit yazılmaz), böylece oyun mantığı değiştirilmeden denge ayarlanabilir.

Yeni bir enstrüman eklemek için:
1. `Instrument` kaydı + kategori (seed üzerinden).
2. Frontend `audio/instrument-adapters` altında bir adapter (sentez veya sample).
3. Pattern `data` şeması + Zod doğrulama.

---

## 17. Test Stratejisi

Katmanlı yaklaşım:
- **Unit:** pattern doğrulama, fairness, ağırlıklı seçim, puanlama, state geçişleri.
- **Integration:** Prisma Repository'leri, PostgreSQL transaction / unique constraint → `backend/tests/integration`.
- **WebSocket:** reconnect, duplicate requestId, event izinleri, timer, stateVersion.
- **E2E:** lobby → katılım → round → playback → voting → sonuç.

Çalıştırma:

```bash
cd backend && npm run test   # jest --runInBand
```

Testler seed'e bağımlı değildir; her test kendi izole verisini kurar.

---

## 18. MVP Sınırları ve Yapılmayanlar

- Kalıcı hesap / auth ve skip yoktur.
- Sunucu yeniden başlatılırsa aktif session geri yüklenmez.
- Sunucu tarafında audio render yoktur.
- Gerçek gitar fiziği / akor / vibrato / bend yoktur (yalnızca tel kesişmeleri).
- Host rolü yoktur; tüm oyuncular eşit yetkidedir.
- Redis / Socket.io / harici state yok; 10 kişilik ölçe için bellek + PostgreSQL yeterlidir.
- Maksimum tekrarlı OG Round sayısı henüz sabit değildir (MVP'de "beraberlik bitene kadar" şeklindedir).
- CI/CD production deployment pipeline'ı MVP dışındadır.

---

## 19. Dosya / Dizin Referansı

### Frontend

- `src/api/` — REST client (`leaderboard.api`, `playback.api`)
- `src/audio/` — `audio-engine`, `playback-controller`, `playback-scheduler`, `playback-flow`, `timing`, `tone-audio-engine`; `instrument-adapters/` (`drum-synth`, `melodic-synth`, `guitar-sample`)
- `src/realtime/` — `game-socket`, `game-session.client`, message handler'lar (`playback`, `voting`, `game-state`)
- `src/stores/` — `playback.store`, `voting.store` (Pinia)
- `src/components/` — Landing, Lobby, InstrumentRoundEditor, PlaybackScreen, PlaybackVotingPage, VotingScreen, LeaderboardUpdatePage, SessionResultScreen

### Backend öne çıkanlar

- `src/server.js` — HTTP + WS başlatma, graceful shutdown
- `src/game/phase.game-state.machine.js` — faz geçişleri
- `src/game/session.game-flow.js` — session akış koordinasyonu
- `src/game/pattern-pool.selection.js` — fairness + ağırlıklı seçim
- `src/game/song-variant.builder.js` — 3 song variant kurulumu
- `src/game/match-scoring.js` — puanlama
- `src/game/og-round.js` — tiebreaker
- `src/realtime/` — connection handler, room.registry, game-state.broadcaster, heartbeat, origin.verifier, request-id.registry
- `repositories/` — her agrega için erişim katmanı (pattern, song-variant, vote, session, leaderboard vb.)

> Belirli bir dosya veya akış hakkında daha derin ayrıntı ararken: dosya düzeyindeki kararların gerekçeleri `game.md` (tasarım günlüğü) ve her modülün içindeki yorumlarda bulunur.

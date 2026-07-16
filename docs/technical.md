# Blind Beat - Teknik Tasarim

> Bu dosya, oyun kurallari netlestikten sonra alinmis teknik mimari kararlarini tutar.

## 1. Genel Mimari

Frontend ve backend ayri uygulamalar olacak.


Vue + Vite frontend
        |
REST API + Native WebSocket
        |
Node.js + Express backend
        |
PostgreSQL


Frontend ve backend Docker Compose icinde ayri servisler olarak calisacak. PostgreSQL de ayri bir servis olacak.

## 2. Gercek Zamanli Iletisim

Native WebSocket protokolu kullanilacak.

- Browser tarafinda native `WebSocket` API
- Node.js backend tarafinda WebSocket server kutuphanesi
- REST API tek seferlik ve kalici islemler icin kullanilacak.
- WebSocket oyun sirasindaki anlik olaylar icin kullanilacak.

### REST sorumluluklari

- Lobby olusturma
- Lobby'ye katilma
- Lobby ayarlarini alma
- Kalici pattern ve match verilerini alma
- Session ve leaderboard verilerini alma

### WebSocket sorumluluklari

- Oyuncu giris/cikis olaylari
- Instrument round baslangici
- Reconnect ve timer olaylari
- Pattern kilitleme bildirimi
- Playback baslangici
- Oylama baslangici ve bitisi
- Leaderboard guncellemesi

### Native WebSocket yazilacak minimum altyapi

- Lobby/room registry
- Connection-to-player eslestirmesi
- Event router
- Mesaj formati ve validation
- Room broadcast
- Heartbeat/ping-pong
- Reconnect state'i
- Mesaj sirasi ve tekrar gelen mesaj kontrolu
- Kontrollu hata mesaji

## 3. Native WebSocket Gerekcesi

10 kisilik lobby ve kucuk JSON mesajlari icin Socket.IO ile native WebSocket arasinda kullanici deneyimini etkileyecek bir performans farki beklenmiyor. Her iki secenek de bu trafik icin fazlasiyla yeterli.

Native WebSocket secildi cunku:

- Protokol ve mesaj akisi daha dogrudan gorulecek.
- Room, reconnect ve broadcast davranislari proje ekibi tarafindan kontrol edilecek.
- Gereksiz abstraction ve fallback davranislari olmayacak.
- Hoca tarafindan istenen moduler ve minimal yapiya daha uygun olacak.

Native WebSocket'in ek sorumlulugu olarak reconnect, heartbeat, room yonetimi ve mesaj validation uygulama kodunda ayrica tasarlanacak.

## 4. WebSocket Mesaj Protokolu

Tum WebSocket mesajlari ortak bir JSON envelope kullanacak:


{
  "type": "pattern:lock",
  "requestId": "req-123",
  "payload": {
    "pattern": []
  }
}


### Event isimlendirme

Event isimleri `domain:action` formatinda olacak:


lobby:join
round:start
pattern:lock
playback:start
vote:submit
leaderboard:update


### Mesaj kurallari

- `roomId` client tarafindan gelen mesaja guvenilerek kabul edilmeyecek; server connection state'ten room bilgisini bulacak.
- `playerId` client tarafindan belirlenemeyecek; server connection/session eslestirmesinden alinacak.
- Oyuncu sirasi, puan, yetki, timer ve oyun state'i client mesajindan kabul edilmeyecek.
- `requestId`, client istegi ile server acknowledgement veya error cevabini eslestirmek icin kullanilacak.
- Gerekli event'lerde server timestamp'i veya server state version'i bulunabilecek.
- Server gelen her mesajda event tipini, payload'i, oyuncu yetkisini ve mevcut game state'i validate edecek.
- Client mesajlari komut/istek, server mesajlari acknowledgement veya broadcast olarak ele alinacak.

### Ornek akis

Client istegi:


{
  "type": "pattern:lock",
  "requestId": "req-123",
  "payload": {
    "pattern": []
  }
}


Server acknowledgement:


{
  "type": "pattern:lock:accepted",
  "requestId": "req-123",
  "payload": {
    "success": true
  }
}


Room broadcast:


{
  "type": "pattern:locked",
  "payload": {
    "playerNickname": "Ahmet"
  }
}


## 5. Room State ve Kalici Veri

Hibrit yapi kullanilacak.

### Server memory'de tutulacak canli state

- Aktif room/lobby registry
- WebSocket connection bilgileri
- Oyuncularin baglanti durumu
- Aktif match ve instrument round fazi
- Timer bilgisi
- Gecici pattern draft'lari
- Reconnect sayaclari
- O anki playback ve voting state'i

### PostgreSQL'de tutulacak kalici veri

- Lobby/session/match kayitlari
- Lobby nickname'leri
- Lock edilmis pattern'ler
- Current ve archive pattern pool kayitlari
- Song variant secimleri
- Oylar
- Match leaderboard puanlari

### MVP siniri

Server restart recovery MVP kapsaminda olmayacak. Server kapanirsa aktif room state'i kaybolabilir ve aktif oyun iptal edilir; daha once PostgreSQL'e kaydedilmis kalici kayitlar korunur.

Redis MVP'de kullanilmayacak. 10 kisilik lobby olceginde memory + PostgreSQL yapisi yeterlidir.

## 6. Oyuncu Session Kimligi

MVP'de kalici hesap veya login olmayacak; oyuncu kimligi session cookie ile yonetilecek.

- Oyuncu nickname girdikten sonra server bir session olusturacak.
- Session cookie browser tarafinda tutulacak.
- Nickname gorunen oyuncu adi olacak; reconnect eslestirmesinde server session cookie'yi esas alacak.
- Nickname lobby icinde unique olacak.
- Session cookie `HttpOnly` olarak ayarlanacak; JavaScript tarafindan okunamayacak.
- Production ortaminda `Secure` kullanilacak.
- `SameSite` politikasi frontend/backend deployment yapisina gore belirlenecek; gerektiginde `Lax` veya kontrollu `None` kullanilacak.
- Ayrı frontend/backend gelistirme ortaminda CORS credentials ayari gerekecek.
- WebSocket handshake sirasinda gelen cookie okunarak connection mevcut player session'ina baglanacak.
- Session store MVP'de server memory'de tutulabilir; server restart recovery kapsam disi oldugu icin stale session temizleme kurali eklenecek.

## 7. Room Registry ve Connection Index'leri

Aktif WebSocket ve room state'i server memory'de uc ayri registry ile tutulacak:

```text
RoomRegistry:
roomId -> RoomState

SessionRegistry:
sessionId -> { roomId, playerId, nickname, status }

ConnectionRegistry:
socket -> sessionId
```

### RoomState

Bir room icinde su canli bilgiler bulunabilir:

- Oyuncular
- Aktif session/match
- Game phase
- Instrument round timer
- Playback ve voting state'i
- Reconnect bilgileri

### Baglanti akisi

1. WebSocket baglantisi gelir.
2. Session cookie okunur.
3. SessionRegistry'den player ve room bulunur.
4. ConnectionRegistry socket ile session'i eslestirir.
5. RoomRegistry oyuncuyu online olarak isaretler.

### Disconnect akisi

1. Socket kapandiginda ConnectionRegistry kaydi temizlenir.
2. SessionRegistry oyuncuyu disconnected olarak isaretler.
3. RoomState reconnect countdown'i baslatir.
4. Oyuncu donerse yeni socket ayni session'a baglanir.
5. Countdown biterse oyuncunun mevcut round katkisi game rule'a gore pas gecilir.

PostgreSQL room registry'nin yerine kullanilmayacak. PostgreSQL kalici pattern, match, vote, archive ve leaderboard verilerini tutacak; memory registry canli WebSocket state'ini yonetecek.

## 8. Heartbeat ve Kopukluk Tespiti

Native WebSocket protocol-level ping/pong kullanilacak.

```text
Ping interval: 5 saniye
Pong timeout: 3 saniye
Kacirilan ping limiti: 2
Reconnect countdown: 30 saniye
```

- Server her 5 saniyede bagli client'lara ping gonderecek.
- Client pong cevabi verirse connection `lastSeen` degeri guncellenecek.
- Iki ping cevapsiz kalirsa server connection'i kopmus kabul edecek.
- Normal WebSocket `close` event'i gelirse countdown heartbeat beklenmeden baslatilacak.
- Kopukluk tespit edilince RoomState icindeki oyuncu `disconnected` isaretlenecek ve 30 saniyelik reconnect countdown baslayacak.
- Heartbeat, reconnect countdown'un bir parcasi olarak bekletilmeyecek; baglanti kontrolu paralel calisacak.
- 15 saniye veya daha uzun ping araligi MVP icin kullanilmayacak; kopukluk tespitini gereksiz geciktirir.

# Blind Beat Teknik Tasarım

Bu belge, oyun kuralları netleştirildikten sonra alınan teknik mimari kararlarını içerir. Uygulama geliştirilirken teknik bir karar değişirse bu belge güncellenmelidir.

## 1. Genel Mimari

Frontend ve backend ayrı uygulamalar olarak geliştirilecektir.

Vue ve Vite frontend
        |
REST API ve Native WebSocket
        |
Node.js ve Express backend
        |
PostgreSQL

Frontend, backend ve PostgreSQL Docker Compose içinde ayrı servisler olarak çalışacaktır.

## 2. Gerçek Zamanlı İletişim

Gerçek zamanlı oyun akışı için native WebSocket kullanılacaktır.

- Tarayıcı tarafında native WebSocket API kullanılacak.
- Node.js tarafında WebSocket sunucusu için bir sunucu kütüphanesi kullanılacak.
- REST API tek seferlik ve kalıcı işlemleri yönetecek.
- WebSocket oyun sırasındaki anlık olayları yönetecek.

### REST API sorumlulukları

- Lobby oluşturma
- Lobbyye katılma
- Lobby ayarlarını alma
- Kalıcı pattern ve match verilerini alma
- Session ve leaderboard verilerini alma

### WebSocket sorumlulukları

- Oyuncu giriş ve çıkış olayları
- Instrument round başlangıcı
- Reconnect ve timer olayları
- Pattern kilitleme bildirimi
- Playback başlangıcı
- Oylama başlangıcı ve bitişi
- Leaderboard güncellemesi

### Gerekli WebSocket altyapısı

- Lobby ve room registry
- Bağlantı ile oyuncu eşleştirmesi
- Event router
- Mesaj formatı ve doğrulama
- Room broadcast
- Heartbeat ve ping-pong
- Reconnect durumu
- Mesaj sırası ve tekrar gelen mesaj kontrolü
- Kontrollü hata mesajları

## 3. Native WebSocket Seçiminin Nedeni

On kişilik lobby ve küçük JSON mesajları için Socket.IO ile native WebSocket arasında kullanıcı deneyimini değiştirecek bir performans farkı beklenmemektedir. Her iki seçenek de bu trafik için yeterlidir.

Native WebSocket seçilmesinin nedenleri:

- Protokol ve mesaj akışı daha doğrudan görülecek.
- Room, reconnect ve yayın davranışları proje içinde kontrol edilecek.
- Gereksiz soyutlama ve fallback davranışları kullanılmayacak.
- Modüler ve minimal proje yapısına daha uygun olacak.

Bunun karşılığında reconnect, heartbeat, room yönetimi ve mesaj doğrulama uygulama içinde ayrıca tasarlanacaktır.

## 4. WebSocket Mesaj Protokolü

Tüm WebSocket mesajları ortak bir JSON zarfı kullanacaktır.

{
  "type": "pattern:lock",
  "requestId": "req-123",
  "payload": {
    "pattern": []
  }
}

### Event isimlendirme

Event isimleri domain:action formatında olacaktır.

lobby:join
round:start
pattern:lock
playback:start
vote:submit
leaderboard:update

### Mesaj kuralları

- Oda bilgisi istemciden gelen roomId değerine güvenilerek kabul edilmeyecek. Sunucu oda bilgisini bağlantı durumundan bulacak.
- Oyuncu kimliği istemci tarafından belirlenemeyecek. Sunucu bu bilgiyi bağlantı ve session eşleştirmesinden alacak.
- Oyuncu sırası, puan, yetki, timer ve oyun durumu istemci mesajından kabul edilmeyecek.
- requestId, istemci isteği ile sunucunun onay veya hata cevabını eşleştirmek için kullanılacak.
- Gereken eventlerde sunucu zaman damgası veya sunucu durum sürümü bulunabilecek.
- Sunucu her mesajda event tipini, payload bilgisini, oyuncu yetkisini ve mevcut oyun durumunu doğrulayacak.
- İstemci mesajları komut veya istek, sunucu mesajları ise onay veya yayın olarak ele alınacak.

### Mesaj akışı örneği

İstemci isteği:

{
  "type": "pattern:lock",
  "requestId": "req-123",
  "payload": {
    "pattern": []
  }
}

Sunucu onayı:

{
  "type": "pattern:lock:accepted",
  "requestId": "req-123",
  "payload": {
    "success": true
  }
}

Oda yayını:

{
  "type": "pattern:locked",
  "payload": {
    "playerNickname": "Ahmet"
  }
}

## 5. Canlı Durum ve Kalıcı Veri

Hibrit bir yapı kullanılacaktır. Oyun sırasında hızlı erişilmesi gereken bilgiler sunucu belleğinde, kalıcı olması gereken bilgiler PostgreSQL içinde tutulacaktır.

### Sunucu belleğinde tutulacak canlı durum

- Aktif room ve lobby registry
- WebSocket bağlantıları
- Oyuncuların bağlantı durumu
- Aktif match ve instrument round aşaması
- Timer bilgileri
- Geçici pattern taslakları
- Reconnect sayaçları
- Playback ve oylama durumu

### PostgreSQL içinde tutulacak kalıcı veri

- Lobby, session ve match kayıtları
- Lobby nickname bilgileri
- Kilitlenmiş patternler
- Current ve archive pattern pool kayıtları
- Song variant seçimleri
- Oylar
- Match leaderboard puanları

### MVP sınırı

Sunucu yeniden başladığında aktif oyun durumunu geri getirme özelliği MVP kapsamında değildir. Sunucu kapanırsa aktif room durumu kaybolabilir ve oyun iptal edilebilir. PostgreSQL içine daha önce kaydedilmiş kalıcı kayıtlar korunur.

Redis MVP içinde kullanılmayacaktır. On kişilik lobby ölçeğinde sunucu belleği ve PostgreSQL birlikte yeterli olacaktır.

## 6. Oyuncu Session Kimliği

MVP içinde kalıcı hesap veya login olmayacak, oyuncu kimliği session cookie ile yönetilecektir.

- Oyuncu nickname girdikten sonra sunucu bir session oluşturacak.
- Session cookie tarayıcıda tutulacak.
- Görünen oyuncu adı nickname olacak; reconnect eşleştirmesinde session cookie esas alınacak.
- Nickname aynı lobby içinde benzersiz olacak.
- Session cookie HttpOnly olarak ayarlanacak ve JavaScript tarafından okunamayacak.
- Production ortamında Secure seçeneği kullanılacak.
- SameSite politikası frontend ve backend dağıtım yapısına göre belirlenecek.
- Ayrı frontend ve backend geliştirme ortamında CORS credentials ayarı yapılacak.
- WebSocket bağlantısı kurulurken gelen cookie okunacak ve bağlantı mevcut player sessionına bağlanacak.
- Session store MVP içinde sunucu belleğinde tutulabilir. Eski session kayıtları için temizleme kuralı eklenecek.

## 7. Room Registry ve Bağlantı Kayıtları

Aktif WebSocket ve room durumu sunucu belleğinde üç registry ile tutulacaktır.

RoomRegistry:
roomId -> RoomState

SessionRegistry:
sessionId -> { roomId, playerId, nickname, status }

ConnectionRegistry:
socket -> sessionId

Bir RoomState içinde şu bilgiler bulunabilir:

- Oyuncular
- Aktif session ve match
- Game phase
- Instrument round timer
- Playback ve oylama durumu
- Reconnect bilgileri

### Bağlantı akışı

1. WebSocket bağlantısı gelir.
2. Session cookie okunur.
3. SessionRegistry içinden oyuncu ve room bulunur.
4. ConnectionRegistry socket ile sessionı eşleştirir.
5. RoomRegistry oyuncuyu çevrimiçi olarak işaretler.

### Disconnect akışı

1. Socket kapandığında ConnectionRegistry kaydı temizlenir.
2. SessionRegistry oyuncuyu bağlantısı kesilmiş olarak işaretler.
3. RoomState reconnect countdownı başlatır.
4. Oyuncu dönerse yeni socket aynı sessiona bağlanır.
5. Countdown biterse mevcut round katkısı oyun kuralına göre pas geçilir.

PostgreSQL room registry yerine kullanılmayacaktır. PostgreSQL kalıcı pattern, match, vote, archive ve leaderboard verilerini tutacak; bellek registryleri canlı WebSocket durumunu yönetecektir.

## 8. Heartbeat ve Kopukluk Tespiti

Native WebSocket protocol-level ping-pong kullanılacaktır.

Ping aralığı: 5 saniye
Pong bekleme süresi: 3 saniye
Kaçırılan ping sınırı: 2
Reconnect countdown: 30 saniye

- Sunucu her 5 saniyede bağlı istemcilere ping gönderecek.
- İstemciden pong cevabı gelirse bağlantının lastSeen değeri güncellenecek.
- İki ping cevapsız kalırsa sunucu bağlantıyı kopmuş kabul edecek.
- Normal WebSocket close eventi gelirse heartbeat beklenmeden countdown başlatılacak.
- Kopukluk tespit edilince oyuncu RoomState içinde disconnected olarak işaretlenecek ve 30 saniyelik reconnect countdown başlayacak.
- Heartbeat, reconnect countdownın bir parçası olarak bekletilmeyecek; iki süreç paralel çalışacak.
- On beş saniye veya daha uzun ping aralığı kullanılmayacak. Bu kadar uzun aralık kopukluk tespitini gereksiz yere geciktirir.

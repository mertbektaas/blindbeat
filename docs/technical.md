# Blind Beat Teknik Tasarım

Bu belge, oyun kuralları netleştirildikten sonra alınan teknik mimari kararlarını içerir. 

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

## 9. Oyun Durumunun Yönetimi

Oyun durumu, dağınık boolean değişkenlerle değil, sabit aşamalar ve merkezi bir geçiş servisiyle yönetilecektir. Bu yaklaşım state machine olarak adlandırılır ve sunucunun aynı anda yalnızca geçerli bir oyun aşamasında bulunmasını sağlar.

### Oyun aşamaları

- LOBBY: Oyuncuların katıldığı ve ayarların yapıldığı aşama.
- INSTRUMENT_ROUND: Oyuncuların pattern oluşturduğu aşama.
- PLAYBACK: Üç song variantın sırayla dinletildiği aşama.
- VOTING: Oyuncuların şarkılara oy verdiği aşama.
- LEADERBOARD: Puanların hesaplanıp sıralamanın güncellendiği aşama.
- OG_ROUND: Final beraberliğini çözmek için oynanan aşama.
- SESSION_RESULT: Session sonucunun ve madalyaların gösterildiği aşama.

### Geçerli geçişler

LOBBY → INSTRUMENT_ROUND

INSTRUMENT_ROUND → PLAYBACK

PLAYBACK → VOTING

VOTING → LEADERBOARD

LEADERBOARD → INSTRUMENT_ROUND veya SESSION_RESULT

LEADERBOARD → OG_ROUND

OG_ROUND → OG_ROUND veya SESSION_RESULT

Geçişler merkezi bir oyun durumu servisi tarafından kontrol edilecektir. WebSocket eventleri yalnızca mevcut aşama o evente izin veriyorsa işlenecektir. Örneğin VOTING aşamasında yeni bir pattern kilitleme isteği kabul edilmeyecektir.

Bu yapı oyun aşamalarının çakışmasını önler, timerların hangi aşamaya ait olduğunu açıkça gösterir ve geçersiz istemci isteklerinin sunucu tarafından reddedilmesini sağlar. MVP için harici bir state machine kütüphanesi kullanılmayacak; geçiş tablosu ve doğrulama mantığı proje içinde modüler olarak yazılacaktır.

## 10. REST API ve WebSocket Görev Ayrımı

İletişim için hibrit yapı kullanılacaktır. REST API kalıcı ve tek seferlik işlemleri, WebSocket ise oyun sırasındaki canlı olayları yönetecektir.

### REST API ile yapılacak işlemler

- Lobby oluşturma
- Lobby bilgilerini alma
- Lobbyye katılma
- Session bilgilerini alma
- Geçmiş matchleri ve leaderboard verilerini alma
- Sağlık kontrolü

### WebSocket ile yapılacak işlemler

- Oyuncunun odaya bağlanması veya odadan ayrılması
- Instrument round başlangıcı
- Pattern kilitleme
- Timer ve reconnect olayları
- Playback başlangıcı
- Oylamanın başlaması ve bitmesi
- Leaderboard güncellemesi

REST, "veriyi getir veya kalıcı bir işlem yap" kanalı olarak; WebSocket ise "oyun şu anda ilerliyor" kanalı olarak kullanılacaktır. Aynı verinin iki kanalda farklılaşmaması için oyun stateinin tek otoritesi sunucu olacaktır.

## 11. Match Sonu Pattern Snapshotı

Instrument roundlar sırasında patternler yalnızca doğrulanıp PostgreSQL içine kaydedilecektir. Bu aşamada current veya archive poolu tekrar tekrar sorgulanmayacaktır.

Tüm instrument roundlar tamamlandığında PatternPoolRepository tek bir toplu sorguyla match için gereken verileri alacaktır:

- Current patternler
- Archive patternleri
- Pattern sahipleri
- Enstrüman bilgileri
- Pattern verileri
- Pool durumları

Bu veriler bellekte PatternPoolSnapshot yapısına dönüştürülecektir. Fairness kontrolü, ağırlıklı rastgele seçim, üç song variantın oluşturulması ve oyuncu katkılarının belirlenmesi snapshot üzerinden çalışacaktır.

Seçim tamamlandıktan sonra seçilen patternlerin pool durumu tek bir transaction içinde güncellenecek ve song variant kayıtları kalıcı olarak yazılacaktır. Snapshot match işlemleri tamamlanınca silinebilir. İleride archive patternlerine ihtiyaç olduğunda yeni bir toplu sorguyla tekrar alınacaktır.

Bu yapı sayesinde instrument round sırasında gereksiz veritabanı sorguları yapılmaz, pattern sahibi için ayrı ayrı sorgu atılmaz ve N+1 sorgu problemi oluşmaz.

## 12. Pattern JSON Yapısı

Pattern verisi ortak bir zarf ve enstrümana özel bir data alanı ile saklanacaktır. Patternin asıl verisi PostgreSQL JSONB alanında tutulacaktır.

Ortak alanlar:

- version: Pattern veri formatının sürümü.
- instrumentType: Patternin ait olduğu enstrüman.
- stepCount: Patternin kaç step içerdiği.
- data: Enstrümana özel pattern içeriği.

Örnek ortak yapı:

{
  "version": 1,
  "instrumentType": "bass",
  "stepCount": 8,
  "data": {
    "steps": ["C2", null, "E2", null]
  }
}

Her enstrümanın data alanı kendi yapısına göre doğrulanacaktır. Davul için step değerleri, melodik enstrümanlar için nota değerleri, gitar için ise tel ve nota eventleri tutulacaktır. Aynı step içinde birden fazla gitar teli eventine izin verilecektir.

Step sayısı pattern verisine sabit olarak gömülmeyecek; stepCount alanından okunacaktır. Bu sayede mevcut MVP 8 step ile başlayabilir, ileride 16 step desteği veritabanı şemasını değiştirmeden eklenebilir.

Pattern doğrulaması ortak alanlar ve instrumentType değerine göre ayrı ayrı yapılacaktır. version alanı da ileride pattern formatı değiştiğinde eski kayıtların okunabilmesini sağlayacaktır.

## 13. Pattern Doğrulama

Pattern doğrulaması hem frontend hem backend tarafında yapılacaktır. Frontend kullanıcıya hızlı geri bildirim verecek, backend ise güvenlik ve server otoritesi için gelen veriyi mutlaka tekrar doğrulayacaktır.

Ortak pattern şemaları Zod ile tanımlanacaktır. Gerekirse aynı şema frontend ve backend arasında ortak bir modülden kullanılacaktır. Böylece iki tarafta aynı veri kurallarının elle tekrar yazılması ve zamanla farklılaşması önlenecektir.

Zod ile şu kontroller yapılacaktır:

- instrumentType değerinin geçerli olması
- stepCount değerinin izin verilen bir değer olması
- steps uzunluğunun stepCount ile uyumlu olması
- Nota değerlerinin geçerli olması
- Gitar tel numarasının 1 ile 6 arasında olması
- Enstrümana özel data alanının doğru yapıda olması

Oyuncunun mevcut roundda pattern gönderip gönderemeyeceği, patternin daha önce kilitlenip kilitlenmediği ve oyuncunun yetkisi gibi oyun kuralları yalnızca backend tarafından kontrol edilecektir. Zod veri biçimini doğrulayacak; oyun statei ve yetki kurallarını ise servis katmanı yönetecektir.

## 14. Veritabanı İlişkileri

Patternler bağımsız kayıtlar olarak tutulacaktır. Patternin asıl step verisi JSONB alanında, patternin ilişkileri ve pool durumu ise ayrı PostgreSQL kolonlarında tutulacaktır.

Ana tablolar:

- players
- sessions
- matches
- instruments
- patterns
- song_variants
- song_variant_patterns
- votes
- leaderboard

Pattern tablosunun temel alanları:

- id
- player_id
- session_id
- match_id
- instrument_id
- pattern_data
- source
- pool_status
- created_at

Bir patternin sahibi player_id, üretildiği match match_id ve ait olduğu enstrüman instrument_id ile belirlenir. Current veya archive durumu pool_status alanında tutulur. Patternin 8 veya 16 step içeriği pattern_data JSONB alanında saklanır.

Bir song variant içindeki pattern bağlantıları song_variant_patterns tablosunda tutulacaktır. Bu tablo hangi patternin hangi şarkıda, hangi enstrüman slotunda kullanıldığını gösterir.

Bu tasarımda Player içinde kalıcı pattern listeleri tutulmayacak ve pattern verisi Match kaydına gömülmeyecektir. Patternler tek bir kaynaktan yönetilecek; Repository ve Service katmanları gerekli oyuncu-pattern ilişkilerini sorgulayacaktır. Event sourcing MVP kapsamında kullanılmayacaktır.

## 15. PostgreSQL Erişim Aracı

PostgreSQL erişimi için Prisma ORM kullanılacaktır. Prisma schema ve migration yönetimini, ilişkisel sorguları ve JSONB pattern verisini düzenli şekilde yönetmek için kullanılacaktır.

Prisma doğrudan controller veya WebSocket event kodlarında kullanılmayacaktır. Veritabanı erişimi Repository katmanında tutulacaktır:

Controller veya WebSocket event
        ↓
Service
        ↓
Repository
        ↓
Prisma Client
        ↓
PostgreSQL

Normal CRUD ve ilişki sorguları Prisma üzerinden yapılacaktır. Match sonunda alınan toplu pattern snapshotı veya çok özel seçim sorguları gerçekten ihtiyaç duyarsa raw SQL yalnızca ilgili repository içinde kullanılabilir. Böylece uygulamanın geri kalanı ORM ayrıntılarına bağlanmayacaktır.

## 16. Prisma Şeması ve Migration Yaklaşımı

Veritabanı şemasının ana kaynağı Prisma schema dosyası olacaktır. Şema üzerinde yapılan değişiklikler migration dosyalarına dönüştürülecek ve migrationlar Git içinde versiyonlanacaktır.

Geliştirme akışı:

1. Prisma schema dosyası güncellenir.
2. Yeni migration oluşturulur.
3. Migration yerel PostgreSQL veritabanında uygulanır.
4. Repository ve Service testleri çalıştırılır.
5. Şema ve migration birlikte commitlenir.

Production ortamında veritabanına doğrudan şema gönderilmeyecek; daha önce oluşturulmuş migrationlar uygulanacaktır. Hızlı prototip denemelerinde db push kullanılabilir, ancak ana geliştirme akışında migration yaklaşımı korunacaktır.

Database first ve tamamen elle yazılan SQL migration yaklaşımı MVP için kullanılmayacaktır. İleride özel PostgreSQL özellikleri gerektiğinde ilgili migration içine kontrollü raw SQL eklenebilir.

## 17. Transaction Sınırları ve Modülerlik

Transaction sınırları işlem gruplarına göre belirlenecektir. Bağımsız işlemler kendi kısa transactionları içinde, birbirine bağlı işlemler ise aynı transaction içinde çalışacaktır.

Instrument round sırasında bir patternin kaydedilmesi kendi kısa transactionı içinde tamamlanacaktır.

Match sonunda aşağıdaki işlemler tek transaction içinde tamamlanacaktır:

- Seçilen patternlerin pool durumunu güncelleme
- Archive durumlarını güncelleme
- Song variant kayıtlarını oluşturma
- Song variant ve pattern bağlantılarını kaydetme
- Match durumunu tamamlandı olarak işaretleme

Oylama sonunda oyların kapanması, kazananın hesaplanması, oyuncu puanlarının güncellenmesi ve leaderboard değişikliğinin kaydedilmesi tek bir transaction içinde yapılacaktır.

Transactionın koordinasyonu MatchService veya ilgili akış servisi tarafından yapılacak; görevler tek bir büyük fonksiyonda toplanmayacaktır.

- PatternPoolRepository veritabanından patternleri getirir ve günceller.
- PatternSelectionService fairness ve ağırlıklı rastgele seçimi yapar.
- SongVariantService üç şarkı varyantını oluşturur.
- MatchRepository match durumunu günceller.
- MatchService işlemleri koordine eder ve transaction sınırını belirler.

Bu yapı transactionların atomik kalmasını sağlarken tekil görev ilkesini de korur.

## 18. Tekrarlanan WebSocket Mesajları

WebSocket mesajlarının ağ gecikmesi, istemci tekrar denemesi veya bağlantı yenilenmesi nedeniyle iki kez gelmesi beklenebilir. Aynı işlem iki kez yapılmamalıdır.

İki katmanlı koruma kullanılacaktır.

Birinci katman olarak sunucu, requestId değerlerini aktif room belleğinde kısa süreli olarak tutacaktır. Daha önce işlenmiş bir requestId tekrar gelirse işlem yeniden yapılmayacak, mümkünse önceki onay veya hata cevabı döndürülecektir. Bu katman gereksiz veritabanı trafiğini azaltır.

İkinci katman olarak PostgreSQL üzerinde benzersiz kısıtlar bulunacaktır. Örneğin:

- Bir oyuncu, bir match ve bir enstrüman için en fazla bir pattern gönderebilir.
- Bir oyuncu aynı match içinde en fazla bir oy kullanabilir.
- Aynı song variant ve pattern bağlantısı birden fazla oluşturulamaz.

Bu işlemler transaction içinde yapılacaktır. Bellekteki requestId kayıtları server yeniden başlatıldığında kaybolsa bile PostgreSQL kısıtları son güvenlik katmanı olarak çalışacaktır.

## 19. Ortak Cevap ve Hata Formatı

REST API ve WebSocket mesajları ortak bir JSON zarfı kullanacaktır. REST tarafında HTTP status kodları korunacak, cevap gövdesi ise WebSocket mesajlarıyla aynı genel yapıyı izleyecektir.

Başarılı bir cevapta success true, sonuç data alanında ve istek kimliği requestId alanında bulunur. Hata durumunda success false olur, data null döner ve hata code ile message alanlarında açıklanır.

Örnek başarı cevabı:

{
  "success": true,
  "data": { "accepted": true },
  "error": null,
  "requestId": "req-123"
}

Örnek hata cevabı:

{
  "success": false,
  "data": null,
  "error": {
    "code": "PATTERN_ALREADY_LOCKED",
    "message": "Pattern daha önce kilitlendi."
  },
  "requestId": "req-123"
}

Hata code alanı frontend kararları için sabit bir makine değeri, message alanı ise kullanıcıya veya loglara uygun açıklama olacaktır. REST cevapları uygun HTTP status kodunu da kullanacaktır.

## 20. WebSocket Yetkilendirme ve Guard Katmanı

WebSocket eventleri çalıştırılmadan önce merkezi bir guard katmanından geçecektir. İstemciden gelen playerId, roomId, puan, timer veya oyun durumu bilgileri yetki kaynağı olarak kabul edilmeyecektir.

Kontrol sırası:

1. Mesaj formatı ve payload doğrulanır.
2. Session cookie ile bağlantının oyuncusu bulunur.
3. Oyuncunun ilgili rooma ait olduğu kontrol edilir.
4. Mevcut game phase evente izin veriyor mu kontrol edilir.
5. Oyuncunun işlem üzerinde sahipliği veya yetkisi kontrol edilir.
6. Event handler yalnızca iş mantığını çalıştırır.

Örnek kurallar:

- Yalnızca aktif oyuncu kendi patternini kilitleyebilir.
- Pattern yalnızca ilgili instrument round içinde gönderilebilir.
- Oy yalnızca voting aşamasında gönderilebilir.
- Oyuncu aynı match içinde birden fazla oy kullanamaz.
- Oyuncu kendi puanını, sırasını veya timerını belirleyemez.
- Session başladıktan sonra yeni oyuncu katılamaz.

MVP içinde rol tabanlı host veya admin yetkisi bulunmayacaktır. Tüm oyuncular aynı temel yetki seviyesinde olacak, oyun statei ve kritik işlemlerin otoritesi sunucuda kalacaktır.

## 21. REST Endpoint ve WebSocket Event Yapısı

REST API kaynak odaklı tasarlanacaktır. WebSocket ise canlı oyun komutlarını ve anlık olayları taşıyacaktır.

Örnek REST kaynakları:

- POST /lobbies: Yeni lobby oluşturur.
- GET /lobbies/:lobbyCode: Lobby bilgilerini getirir.
- POST /lobbies/:lobbyCode/join: Lobbyye katılım isteği oluşturur.
- GET /sessions/:sessionId: Session özetini getirir.
- GET /matches/:matchId: Match özetini getirir.
- GET /matches/:matchId/leaderboard: Match leaderboardını getirir.
- GET /matches/:matchId/patterns: Geçmiş veya yetkili pattern bilgilerini getirir.

Örnek WebSocket eventleri:

- lobby:join
- lobby:player-joined
- lobby:player-left
- round:start
- round:timer
- pattern:lock
- pattern:locked
- playback:start
- playback:complete
- vote:start
- vote:submit
- vote:complete
- leaderboard:update
- session:complete

Pattern kilitleme ve oy verme gibi canlı oyun komutları REST endpointi olmayacak; WebSocket üzerinden gönderilecektir. Kilitlenmiş patternleri veya geçmiş leaderboard verisini sonradan görüntülemek ise REST üzerinden yapılacaktır.

Yeni endpoint veya event eklenirken önce bunun kalıcı bir kaynak işlemi mi, yoksa canlı oyun olayı mı olduğu belirlenecektir. Kaynak işlemleri RESTe, canlı olaylar WebSockete ait olacaktır.

## 22. WebSocket Komut, Onay ve Yayın Akışı

WebSocket işlemleri üç ayrı mesaj rolüyle yönetilecektir:

1. İstemci komutu servera gönderir.
2. Server yalnızca komutu gönderen oyuncuya onay veya hata cevabı döner.
3. İşlem room içindeki diğer oyuncuları ilgilendiriyorsa sınırlı bir yayın yapılır.

Örneğin pattern kilitleme akışı şöyledir:

- Oyuncu pattern:lock komutunu ve requestId değerini gönderir.
- Server session, room, game phase, pattern formatı ve oyuncu sahipliğini kontrol eder.
- İşlem başarılıysa gönderen oyuncuya pattern:lock:accepted cevabı döner.
- Diğer oyunculara yalnızca pattern:locked olayı ve gerekli anonim bilgiler yayınlanır.
- İşlem başarısızsa ortak hata zarfı kullanılır ve room yayını yapılmaz.

Server her işlemden sonra bütün room durumunu yayınlamayacaktır. Yalnızca olayın gerektirdiği minimum bilgi gönderilecek; pattern içeriği, oyuncu katkısı veya gizli seçim bilgileri izin verilen aşama dışında yayınlanmayacaktır.

## 23. İstemci ve Server State Senkronizasyonu

İstemci ve server arasında hibrit senkronizasyon kullanılacaktır. Normal oyun akışında yalnızca state değişikliğini anlatan küçük WebSocket eventleri gönderilecek; ilk bağlantı, reconnect veya event kaçırma durumunda filtrelenmiş bir state snapshotı alınacaktır.

Her state değişikliğinde bir stateVersion değeri bulunacaktır. İstemci kendi sürümü ile gelen eventin sürümünü karşılaştıracaktır. Sürümler arasında boşluk varsa istemci yeniden snapshot isteyecek ve görünür stateini serverdan güncelleyecektir.

Snapshot yalnızca oyuncunun o aşamada görmesine izin verilen bilgileri içerecektir. Pattern içeriği, gizli oylar ve diğer oyuncuların henüz açıklanmamış katkıları snapshot içine eklenmeyecektir.

Server statein tek kaynağıdır. İstemci bu statein yalnızca kullanıcıya gösterilmesi gereken alanlarını bellekte tutar ve kendi verisini serverın yerine geçecek şekilde değiştiremez.

## 24. Oyuncu Bazlı Round Deadline ve Reconnect

Instrument round için ortak bir başlangıç zamanı bulunacak, ancak her oyuncunun pattern gönderebileceği son zaman ayrı tutulacaktır. Bu sayede bağlantısı kopan oyuncu geri döndüğünde diğer oyuncuların süresini değiştirmeden kendisine yeni bir süre verilebilir.

Normal akışta oyuncunun deadline değeri round başlangıcı artı 30 saniye olarak belirlenir. Oyuncu round sırasında disconnect olursa reconnect countdown bağlantının koptuğu anda başlar. Oyuncu countdown içinde geri dönerse kendi katkı deadlineı yeniden bağlantı zamanı artı 30 saniye olarak hesaplanır.

Örnek:

Oyuncu A ve B round başlangıcından itibaren 10 saniyeye sahiptir. Oyuncu C disconnect durumundadır. A ve B beş saniyeye düştüğünde C yeniden bağlanırsa, A ve B mevcut deadlinelarıyla devam eder; C ise yeniden bağlantı anından itibaren 30 saniyelik kendi deadlineına sahip olur.

Roundun kapanması şu koşullardan biri gerçekleştiğinde değerlendirilir:

- Tüm oyuncular patternini kilitlemiştir.
- Bağlı oyuncuların kendi deadlineı dolmuştur.
- Disconnect olan oyuncunun reconnect countdownı dolmuş ve katkısı pas geçilmiştir.
- Reconnect olan oyuncunun kendisine verilen yeni deadlineı dolmuştur.

Server her oyuncunun deadlineını ayrı takip eder. Client timerı yalnızca görsel geri sayımdır; pattern kabulü ve roundun kapanması server saatine göre belirlenir. Bir oyuncunun yeniden bağlanması diğer oyuncuların timerını sıfırlamaz veya uzatmaz.

## 25. Eşzamanlı İşlemler ve Yarış Durumları

Aynı anda gelen işlemlerde dört katmanlı koruma kullanılacaktır:

- Basit işlemlerde önce server state kontrolü yapılacaktır.
- Kalıcı işlemler transaction içinde çalışacaktır.
- Tekrar edilmemesi gereken işlemler PostgreSQL unique constraint ile korunacaktır.
- Aynı pattern veya pool slotunun iki işlem tarafından seçilebileceği kritik bölümlerde satır kilitleme kullanılacaktır.

Match sonu pattern seçiminde transaction başlatılacak, gerekli pool kayıtları kilitlenecek, fairness ve seçim işlemi yapılacak, pattern durumları güncellenecek ve song variant bağlantıları kaydedilecektir. Tüm adımlar başarılı olursa transaction tamamlanacak; hata olursa tamamı geri alınacaktır.

Her işlemde satır kilidi kullanılmayacaktır. Kilit yalnızca aynı verinin aynı anda seçilebileceği veya güncellenebileceği kritik işlemlerde uygulanacaktır. Böylece güvenilirlik korunurken gereksiz database beklemeleri önlenecektir.

## 26. Loglama ve Hata İzleme

MVP içinde yapılandırılmış JSON loglar kullanılacaktır. Her önemli log kaydı en azından seviye, event adı, zaman damgası ve mümkünse roomId, sessionId, playerId ve requestId bilgilerini içerecektir.

REST ve WebSocket istekleri requestId ile takip edilecektir. Bir isteğin alınması, doğrulanması, veritabanına yazılması ve cevabının gönderilmesi aynı requestId üzerinden ilişkilendirilebilecektir. Bu yapı duplicate mesajları, transaction hatalarını ve reconnect problemlerini takip etmeyi kolaylaştırır.

MVP içinde ELK veya harici bir log platformu kurulmayacaktır. İlk aşamada Node.js serverın yapılandırılmış logları yeterli olacak, ileride trafik ve operasyon ihtiyacı artarsa harici log toplama sistemi eklenebilecektir.

## 27. MVP Test Stratejisi

MVP için katmanlı test yaklaşımı kullanılacaktır. Proje deploy edilmeyeceği ve gerçek production trafiği almayacağı için büyük ölçekli yük testi veya ayrı bir operasyon sistemi kurulmayacaktır.

Test kapsamı:

- Unit test: Pattern doğrulama, fairness, ağırlıklı seçim, puanlama ve state geçişleri.
- Integration test: Prisma Repositoryleri, PostgreSQL transactionları ve unique constraintler.
- WebSocket testleri: Reconnect, duplicate requestId, event izinleri, timer ve stateVersion davranışı.
- Temel E2E test: Lobby oluşturma, oyuncu katılımı, instrument round, playback, voting ve session sonucu.

Testler özellikle oyun kurallarının ve server otoritesinin doğru çalıştığını doğrulayacaktır. Büyük yük testi, production deployment ve harici test altyapısı MVP kapsamına alınmayacaktır.

## 28. Frontend State Yönetimi

Frontendde ortak oyun durumu için Pinia kullanılacaktır. Lobby, oyuncu bilgileri, game phase, instrument round, görünür timer, playback, voting ve leaderboard gibi birden fazla ekranda kullanılan bilgiler merkezi storelarda tutulacaktır.

Componenta özel geçici UI durumu component içinde kalacaktır. Örneğin input değeri, açık modal veya geçici hata görünümü merkezi storea taşınmayacaktır.

WebSocket eventleri Pinia store actionları veya store içindeki kontrollü güncelleme fonksiyonları üzerinden uygulanacaktır. Componentler WebSocket mesajlarını doğrudan yorumlayıp kendi stateini değiştirmeyecek; serverdan gelen ortak state merkezi store üzerinden ekranlara dağıtılacaktır.

Kendi composable tabanlı state altyapımızı kurmayacağız. Pinia, Vue ekosistemiyle uyumlu ve bu projenin lobby, round, playback ve voting ekranları arasındaki ortak state ihtiyacı için yeterli olacaktır.

## 29. Docker Compose Kapsamı

Frontend, backend ve PostgreSQL Docker Compose içinde ayrı servisler olarak çalışacaktır. Geliştirme ortamında gerekli servisler aynı compose ağı içinde birbirine bağlanacaktır.

- Frontend servisi Vue ve Vite uygulamasını çalıştırır.
- Backend servisi Node.js, Express ve WebSocket sunucusunu çalıştırır.
- PostgreSQL servisi kalıcı veritabanını çalıştırır.

Geliştirme sırasında kaynak kodları containerlara volume olarak bağlanacak ve hot reload kullanılacaktır. Servisler bilgisayara özel Node veya PostgreSQL kurulumlarına bağlı kalmayacaktır. Proje deploy edilmeyecek olsa da Docker Compose, geliştirme ortamını tekrarlanabilir ve anlaşılır tutacaktır.

## 30. Ortam Değişkenleri

Ortam ayarları ve gizli bilgiler kod içine yazılmayacaktır. Gerçek değerler yerel .env dosyasında tutulacak, .env dosyası Git tarafından ignore edilecektir.

Git içinde yalnızca .env.example dosyası bulunacak. Bu dosya gerekli değişken adlarını ve örnek değerleri gösterecek, gerçek şifre veya session secret içermeyecektir.

Temel değişkenler:

- DATABASE_URL
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- BACKEND_PORT
- FRONTEND_PORT
- SESSION_SECRET

Docker Compose, backend ve PostgreSQL bağlantısı aynı değişken isimlerini kullanacaktır. Böylece kod değişmeden farklı geliştirme ortamları için farklı .env değerleri kullanılabilecektir.

## 31. PostgreSQL Veri Kalıcılığı

PostgreSQL verileri Docker named volume içinde tutulacaktır. Container yeniden başlatılsa veya yeniden oluşturulsa bile volume korunacağı için veritabanı kayıtları kaybolmayacaktır.

Kod ve geçici geliştirme dosyaları PostgreSQL data klasörüne host volume olarak bağlanmayacaktır. İşletim sistemi izinleri ve PostgreSQL sürüm uyumsuzluklarını önlemek için veritabanı dosyalarının yönetimi Dockera bırakılacaktır.

Test veritabanını sıfırlamak gerektiğinde named volume bilinçli olarak silinebilir. Bu işlem yalnızca kullanıcı onayıyla yapılacaktır.

## 32. PostgreSQL İndeksleri

İndeksler tabloya rastgele eklenmeyecek, Repository katmanında kullanılan sorgulara göre belirlenecektir. Tüm kolonları indekslemek yerine yüksek frekansta filtrelenen ve ilişki kurulan alanlar hedeflenecektir.

Öncelikli indeks alanları:

- patterns tablosunda player_id
- patterns tablosunda match_id, instrument_id ve pool_status birleşimi
- patterns tablosunda instrument_id ve pool_status birleşimi
- votes tablosunda match_id ve player_id birleşimi
- song_variant_patterns tablosunda song_variant_id

Primary key ve unique constraintler de kendi indekslerini oluşturacaktır. Yeni bir indeks eklenmeden önce sorgunun gerçekten bu indekse ihtiyaç duyduğu kontrol edilecektir. Gereksiz indekslerin pattern yazma işlemlerini yavaşlatmamasına dikkat edilecektir.

## 33. Graceful Shutdown

Backend kapanmadan önce kontrollü bir kapanış akışı çalıştırılacaktır. Yeni WebSocket bağlantıları kabul edilmeyecek, aktif bağlantılara kapanış bilgisi gönderilecek, timerlar ve canlı room registryleri temizlenecek, ardından PostgreSQL bağlantıları kapatılacaktır.

Aktif session recovery MVP kapsamında olmasa da açık bağlantıların ve kaynakların düzgün kapatılması korunacaktır. Docker containerı yeniden başlatıldığında serverın bağlantıları ve database poolu kontrollü şekilde bırakması sağlanacaktır.

## 34. CORS ve Frontend-Backend Erişimi

Frontend ve backend ayrı containerlarda çalışacağı için backend yalnızca izin verilen frontend originlerine cevap verecektir. İzin verilen originler .env içinden okunacaktır.

Geliştirme ortamında örnek frontend origini localhost üzerindeki Vite adresidir. Production için farklı bir origin tanımlanabilir. Her kaynağa izin veren yıldız biçimindeki CORS ayarı kullanılmayacaktır.

Session cookie ile yapılan isteklerde credentials kullanılacaktır. CORS ayarı, cookie politikası ve frontend isteği birlikte yapılandırılacak; frontend adresi açıkça izin verilen origin listesinde bulunacaktır.

## 35. Cookie Güvenliği ve CSRF

Session cookie HttpOnly olarak ayarlanacak ve JavaScript tarafından okunamayacaktır. Production ortamında Secure kullanılacak, SameSite politikası deployment yapısına göre belirlenecektir.

Cookie ile kimlik taşıyan ve veri değiştiren REST isteklerinde CSRF token kontrolü yapılacaktır. Token olmadan gelen veya geçersiz token içeren istekler server tarafından reddedilecektir.

WebSocket bağlantısı kurulurken Origin başlığı kontrol edilecek ve yalnızca CORS yapılandırmasında izin verilen originlerden gelen bağlantılar kabul edilecektir. WebSocket protokolü için RESTteki CSRF token akışı birebir kullanılmayacak; bağlantı Origin kontrolü, session cookie ve event yetkilendirmesiyle korunacaktır.

Bu korumalar login sistemi olmasa da kullanılacaktır. Session cookie oyuncu kimliği taşıdığı için dış bir sitenin oyuncu adına işlem yapması engellenmiş olacaktır.

## 36. Rate Limit ve Mesaj Boyutu Sınırları

MVP içinde rate limit uygulama seviyesinde server tarafından yönetilecektir. Her WebSocket bağlantısı ve session için event türüne göre mesaj kotası tutulacak, WebSocket mesajlarının ve pattern payloadlarının maksimum boyutu doğrulanacaktır.

Özellikle şu işlemler sınırlandırılacaktır:

- Pattern düzenleme eventleri kısa zaman aralığında sınırlı sayıda kabul edilecek.
- Pattern kilitleme bir oyuncu ve instrument round için en fazla bir kez yapılacak.
- Oy verme bir oyuncu ve match için en fazla bir kez yapılacak.
- Pattern step sayısı ve toplam JSONB payload boyutu izin verilen sınırı aşamayacak.

Rate limit server belleğinde tutulacaktır. Lobby boyutu en fazla 10 oyuncu olduğu için MVP içinde Redis veya harici bir rate limit servisi kullanılmayacaktır.

## 37. API Dokümantasyonu

REST API için OpenAPI standardı kullanılacaktır. OpenAPI dosyası endpointleri, HTTP methodlarını, istek gövdelerini, cevap yapılarını, hata kodlarını ve gerekli parametreleri tanımlayacaktır. Bu tanımdan ileride Swagger benzeri etkileşimli bir API ekranı üretilebilecektir.

WebSocket eventleri REST endpointi olmadığı için ayrı bir WebSocket iletişim dokümanında tutulacaktır. Bu dokümanda event adı, gönderen taraf, payload, onay cevabı, hata cevabı ve room yayını tanımlanacaktır.

REST ve WebSocket dokümanları birlikte Blind Beat iletişim sözleşmesini oluşturacaktır. Kod geliştirilirken yeni bir endpoint veya event eklenmeden önce ilgili sözleşme güncellenecektir.

REST tarafında lobby, session, match, pattern, song variant, vote ve leaderboard kaynakları bulunacağı için endpoint sayısı birkaç kayıt işlemiyle sınırlı tutulmayacaktır. Kaynaklar OpenAPI içinde ayrı ayrı belgelenerek API büyüdükçe takip edilebilir kalacaktır.

## 38. Kalan Mimari Tercihler

Bu aşamada aşağıdaki kararlar kesinleştirilmiştir:

- OpenAPI ve WebSocket dokümanları ayrı dosyalarda tutulacaktır.
- REST kaynaklarının tamamı baştan tasarlanacak; yalnızca minimum endpoint ile ilerlenmeyecektir.
- Veritabanında iç ilişkiler için integer, dışarıya açılan kimliklerde UUID veya lobby kodu kullanılacaktır.
- Repository ve Service yapısı domain bazlı modüler olarak kurulacaktır.
- Backend testleri için Jest ve Supertest kullanılacaktır.
- OpenAPI dosyası şimdilik elle yazılacaktır.
- WebSocket event dokümanında event adı, gönderen taraf, payload, onay, hata, yayın ve game phase bilgileri bulunacaktır.
- Veritabanı hataları kullanıcıya güvenli ortak hata olarak dönecek, teknik ayrıntılar loglarda tutulacaktır.
- Uygulama dikey modüller halinde geliştirilecektir. Her modül tamamlandığında tek başına çalıştığı doğrulanacaktır.

Seed verisi ve CI yaklaşımı ayrıca kararlaştırılacaktır.

## 39. Seed, Test Verisi ve CI

Geliştirme ve demo ortamı için seed scripti kullanılacaktır. Seed scripti örnek enstrümanları, test oyuncularını, örnek patternleri ve gerektiğinde test lobby verisini oluşturacaktır. Gerçek kullanıcı veya production verisi seed içine yazılmayacaktır.

Otomatik testler seed verisine bağımlı olmayacak; her test kendi izole test verisini oluşturacaktır. Böylece testlerin çalışma sırası birbirini etkilemeyecektir.

CI için GitHub Actions kullanılacaktır. Push veya Pull Request sonrasında bağımlılık kurulumu, lint, Jest ve Supertest testleri, Prisma schema doğrulaması ve gerekli integration kontrolleri çalıştırılacaktır. MVP için ayrı bir CD deployment pipelineı kurulmayacaktır.

## 40. İleride Kubernetes Ortamına Geçiş

Uygulama Docker containerlarıyla tasarlanacağı için ileride Kubernetes üzerinde çalıştırılabilir. Docker Compose yalnızca yerel geliştirme orkestrasyonudur; Kubernetes için ayrıca Deployment, Service, ConfigMap, Secret ve migration job tanımları hazırlanması gerekir.

Tek backend replica ile geçiş daha basit olacaktır. Birden fazla backend replica kullanılmak istenirse mevcut server belleğindeki room registry, session store ve oyun statei ortak hale getirilmelidir. Bu durumda Redis veya benzeri paylaşılan bir state katmanı ve WebSocket bağlantı yönlendirmesi gerekir.

PostgreSQL de production ortamında ayrı ve kalıcı bir servis olarak çalıştırılmalıdır. Uygulama containerlarının yeniden başlatılması oyun stateini kalıcı hale getirmez. Bu nedenle Docker ve graceful shutdown kararları Kubernetes geçişini mümkün kılar, ancak çoklu replica desteği için shared state daha sonra ayrıca tasarlanacaktır.

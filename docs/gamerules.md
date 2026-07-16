
## 1. Oyunun Fikri

Blind Beat, oyuncuların diğer oyuncuların katkılarını duymadan müzik patternleri oluşturduğu çok oyunculu bir müzik oyunudur. Oyun sonunda sistem bu patternleri birleştirerek üç farklı şarkı varyantı üretir. Oyuncular şarkıları anonim olarak dinler ve en beğendikleri şarkıya oy verir.

## 2. Temel Kavramlar

- Lobby: Oyuncuların oyun başlamadan önce toplandığı oda.
- Session: Lobby içinde art arda oynanacak toplam match sayısı.
- Match: Tüm enstrüman roundlarının, üç şarkı playbackinin, oylamanın ve puanlamanın tamamlandığı oyun döngüsü.
- Instrument round: Tek bir enstrümana ayrılan 30 saniyelik üretim aşaması.
- Pattern: Bir oyuncunun bir instrument round içinde oluşturduğu 8 step müzik verisi.
- Song variant: Her enstrümandan bir patternin birleştirilmesiyle oluşan tam şarkı.
- Pattern pool: Enstrüman bazında kullanılmayı bekleyen pattern havuzu.
- Archive: Aktif havuzdan çıkan veya seçilmeyen eski patternlerin saklandığı alan.
- OG Round: Final leaderboard beraberliğini çözmek için archive patternleriyle oynanan tiebreaker.

## 3. Lobby Ayarları

- Maksimum oyuncu sayısı: 10
- Maksimum match sayısı: 5
- Instrument round süresi: 30 saniye
- Pattern gridi: 8 step
- Her match sonunda üretilecek şarkı varyantı: 3
- Her instrument round içinde her oyuncu bir pattern üretir.
- Session başladığında lobby kilitlenir. Yeni oyuncu alınmaz, yalnızca mevcut oyuncular reconnect edebilir.
- Minimum 4 oyuncu yoksa session başlatılamaz.
- Session başlamadan önce oyuncu eklenir veya ayrılırsa uygunluk koşulları yeniden hesaplanır.

## 4. Enstrümanlar

İlk aday havuzunda 7 enstrüman vardır. Bir lobby, her match için en fazla 6 enstrüman seçebilir:

1. Kick veya drum
2. Snare veya percussion
3. Hi-hat
4. Bass
5. Chord synth
6. Lead synth
7. Elektro gitar

Pluck ve FX ileride eklenebilir. Enstrüman listesi ve maksimum seçim sayısı config üzerinden değiştirilebilir.

Oyuncular her instrument round içinde aynı enstrüman için ayrı ayrı pattern üretir. Örneğin 7 oyuncu Guitar round içinde 7 gitar patterni oluşturur. Oyunculara tek tek enstrüman dağıtılmaz ve enstrüman derecesi kullanılmaz.

## 5. Pattern Üretimi

Her instrument round içinde:

1. Tek bir enstrüman seçilir.
2. Tüm oyuncular aynı anda 8 step gridi doldurur.
3. Oyuncu patterni oluştururken sesi anlık olarak duyabilir.
4. Play, patterni önizler.
5. Clear, patterni temizler.
6. Lock, patterni gönderir ve düzenlemeyi kapatır.
7. Süre dolarsa pattern o anki haliyle kilitlenip havuza kaydedilir.

Oyuncular diğer oyuncuların patternlerini veya önceki katkılarını görmez ve duymaz. Bir oyuncunun bağlantısı kopsa bile sonraki instrument roundlara katılabilir.

## 6. Pattern Pool

Her enstrümanın ayrı bir pattern poolu vardır. Bir match içinde üretilen tüm yeni patternler ilgili enstrümanın havuzuna eklenir.

- Her enstrüman için aktif pool limiti 50 pattern.
- Pool limiti aşılırsa pattern silinmez, archive alanına taşınır.
- Seçilen pattern normal akışta pooldan çıkarılır ve tekrar kullanılmaz.
- Seçilmeyen patternler sonraki matchlere aktarılır.
- Archive patternleri OG Round içinde kullanılabilir.
- Bir session içinde en fazla 5 match oynanır.

Yeni patternlerin seçilme ağırlığı x1.20, eski patternlerin ağırlığı x1.00 olur. Bu katsayı oyuncuya puan vermez; yalnızca patternin seçilme olasılığını etkiler.

## 7. Üç Şarkının Oluşturulması

Tüm teorik kombinasyonlar hesaplanmaz. Her enstrüman için yalnızca üç pattern seçilir ve bunlar üç song variante rastgele dağıtılır.

Guitar: G1, G2, G3
Drums:  D1, D2, D3
Bass:   B1, B2, B3

Song 1: G1 + D3 + B2
Song 2: G3 + D1 + B1
Song 3: G2 + D2 + B3

Patternler aynı index ile eşleşmek zorunda değildir. Her song variant seçilen tüm enstrüman katmanlarını içerir; hiçbir katman elenmez.

## 8. Fairness Kuralı

Üç şarkı içindeki toplam pattern slotu şu şekilde hesaplanır:

3 x seçilen enstrüman sayısı

Her oyuncunun en az bir slotta temsil edilmesi gerekir. Bu, her oyuncudan tam olarak bir pattern seçileceği anlamına gelmez; bir oyuncunun birden fazla patterni seçilebilir.

Oyuncu sayısına göre minimum enstrüman sayısı:

| Oyuncu | Minimum enstrüman | Toplam slot |
|---:|---:|---:|
| 4 | 2 | 6 |
| 5 | 2 | 6 |
| 6 | 2 | 6 |
| 7 | 3 | 9 |
| 8 | 3 | 9 |
| 9 | 3 | 9 |
| 10 | 4 | 12 |

Seçim sırası:

1. Önce henüz temsil edilmeyen oyuncuların uygun patternleri rezerve edilir.
2. Her enstrüman için en fazla üç pattern seçilir.
3. Boş kalan slotlar ağırlıklı rastgele seçimle doldurulur.
4. Seçilen patternler her enstrüman içinde rastgele karıştırılır.
5. Üç şarkıda tüm oyuncuların temsil edildiği tekrar kontrol edilir.

Düşük puanlı oyuncuya ekstra seçim avantajı verilmez. Rekabet, sistemin yapay telafisiyle değil pattern kalitesi ve oylamayla belirlenir.

## 9. Match Akışı

1. Seçilen her enstrüman için sırayla instrument round oynanır.
2. Tüm patternler ilgili poollara kaydedilir.
3. Her enstrümandan üç pattern seçilir.
4. Üç tam song variant oluşturulur.
5. Şarkı playback sırası rastgele belirlenir.
6. Üç şarkı anonim olarak oynatılır.
7. Oylama açılır ve oyuncular bir şarkı seçer.
8. Oylar hesaplanır ve pattern sahiplerine puan verilir.
9. Match leaderboardı güncellenir.
10. Session içinde match kaldıysa yeni match başlar; kalmadıysa final sonucu gösterilir.

## 10. Playback ve Oylama

- Her şarkı 5 loop çalar.
- 8 step ve 120 BPM varsayımında bir loop yaklaşık 2 saniyedir.
- Üç şarkı sırayla oynatılır.
- Playback ekranında yalnızca üç progress bar görülür.
- Pattern detayları, oyuncu isimleri ve oy sayıları playback ve oylama sırasında gizlidir.
- Oy sayıları oylama bitene kadar gösterilmez.
- Üç playback tamamlanmadan oylama başlamaz.
- Oyuncu patterne değil, bütün şarkıya oy verir.
- Oylama bitince G1 + H3 + D2 gibi anonim kodlar gerçek oyuncu isimlerine dönüştürülür.

## 11. Puanlama

- Tek bir şarkı kazanırsa, o şarkıda patterni bulunan her benzersiz oyuncu 1 puan alır.
- Aynı oyuncunun kazanan şarkıda birden fazla patterni varsa normalde yine 1 puan alır.
- Tüm oylar tek şarkıya giderse kazanan şarkının pattern sahipleri x2 puan alır.
- x2, pattern başına değil oyuncu başına uygulanan normal kazanç katsayısıdır.
- En yüksek oyda iki veya üç şarkı berabere kalırsa yalnızca berabere kalan şarkılar puanlamaya dahil edilir.
- Berabere kalan şarkılarda bir oyuncunun kaç patterni seçildiyse o kadar puan alır.
- Katsayılar sabit kodlanmayacak, ileride config üzerinden okunabilir olacaktır.
- Leaderboard her match sonunda güncellenir.

## 12. Tiebreaker: OG Round

Sessionın son matchinden sonra en yüksek skor berabereyse OG Round başlar.

- Yalnızca berabere kalan oyuncular yarışmacıdır.
- Her yarışmacı için yalnızca kendi archive patternlerinden bir şarkı oluşturulur.
- İki yarışmacı varsa iki, üç yarışmacı varsa üç şarkı üretilir.
- Normalde yarışmacılar oy kullanamaz; diğer lobby oyuncuları oy verir.
- Lobbydeki herkes berabere kaldıysa yarışmacılar rakiplerinin şarkılarına oy verebilir, kendi şarkılarına veremez.
- Beraberlik devam ederse archive içindeki farklı patternlerle OG Round tekrarlanır.
- Birinci belirlendikten sonra yalnızca ikinci ve üçüncü arasındaki beraberlik için yeni OG Round oynanmaz.
- Beraberlik pratikte çözülmezse berabere kalan herkes finalde gold medal alır.

Simülasyonda üç yarışmacının OG Round beraberliğinin ilk turda çözülme oranı yaklaşık yüzde 75,066, beş tur sonrasında hâlâ devam etme oranı yüzde 0,098 oldu. Ortalama tekrar sayısı 1,3325 olarak ölçüldü.

## 13. Ses Sistemi

- Kick, snare, hi-hat, bass, chord synth ve lead synth sentez tabanlı ses kullanır.
- Elektro gitar gerçek kayıt assetleri kullanır.
- Gitar 6 tellidir.
- Oyuncu gitar tellerinin üzerinden çizgi geçirir.
- Çizginin tel ile kesişmesi nota eventi oluşturur.
- Çizginin yatay konumu 8 step zaman sistemine quantize edilir.
- Aynı step içinde birden fazla tel kesilirse birden fazla nota veya strum eventi oluşturulabilir.
- Perde, vibrato, bend ve gerçek gitar fiziği MVP içinde yoktur.
- Gitar tuning, nota dizisi ve akorlar ses tasarımı testlerinden sonra belirlenecektir.

## 14. Sesin Çalınması ve Senkron

Sunucu ses render etmez. Sunucu pattern referanslarını, BPM değerini, playback sırasını, oyun fazını ve başlangıç zamanını yönetir. Sesler istemci tarafında çalınır.

1. İstemci ses assetlerini yükler veya sentez enstrümanlarını hazırlar.
2. Hazır olduğunu sunucuya bildirir.
3. Sunucu gelecekteki ortak başlangıç zamanını yayınlar.
4. İstemci pattern eventlerini kendi Web Audio veya Tone.js saatinde planlar.
5. Tüm katmanlar aynı yerel audio clock ile başlar.

İstemciler arasında sample seviyesinde kusursuz senkron hedeflenmez. Her oyuncunun kendi cihazında şarkı katmanlarının uyumlu çalması yeterlidir.

## 15. Lobby ve Bağlantı Kuralları

- Kullanıcı ya lobby oluşturur ya da lobby koduyla katılır.
- Lobby kodunu sunucu üretir.
- MVP içinde hesap, auth ve kalıcı profil yoktur.
- Nickname aynı lobby içinde benzersiz olmak zorundadır.
- Session başladığında lobby kilitlenir.
- Sessionı başlatan oyuncunun host yetkisi yoktur; sunucu tek otoritedir.
- Session bittikten sonra aynı lobby yeniden kullanılmaz; yeni oyun için yeni lobby açılır.
- Tüm oyuncular ayrılınca lobby silinir.

## 16. Reconnect

- Reconnect countdownı instrument round süresine eşittir: 30 saniye.
- Oyuncu round içinde koparsa countdown başlar.
- Countdown içinde dönerse diğer oyuncular roundun bitmesini bekler.
- Oyuncu geri döndüğünde o round için tam 30 saniye verilir.
- Bir match içinde oyuncunun en fazla 2 reconnect hakkı vardır.
- Reconnect sayacı her match başında sıfırlanır.
- İlk katılım reconnect sayacını artırmaz.
- Üçüncü reconnect denemesinde oyuncu bağlanır bağlanmaz atılır.
- Oyuncu roundu kaçırırsa o round katkısı pas geçilir; sonraki roundlara katılabilir.

## 17. Güncel MVP Sınırları

- Kalıcı kullanıcı hesabı ve authentication yoktur.
- Sunucu yeniden başladıktan sonra aktif sessionı geri getirme özelliği yoktur.
- Sunucu tarafında audio rendering yoktur.
- Gerçek gitar fiziği yoktur; gitar etkileşimi tel kesişmelerine indirgenir.
- Estetik ve animasyon detayları teknik temel oturduktan sonra belirlenecektir.
- Pool, puan ve OG Round algoritmaları config üzerinden değiştirilebilir tasarlanacaktır.


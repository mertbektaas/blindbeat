# Blind Beat - Game Rules

Bu dosya, `game.md` icindeki uzun tasarim notlarinin okunabilir ve guncel ozetidir. Yeni bir karar alindiginda once burada kisa ve net hali guncellenir; `game.md` ayrintili tasarim gunlugu olarak kalir.

## 1. Oyunun Fikri

Blind Beat, oyuncularin diger oyuncularin katkilarini duymadan muzik pattern'leri olusturdugu cok oyunculu bir muzik oyunudur. Oyun sonunda sistem bu pattern'leri birlestirerek uc farkli sarki varyanti uretir. Oyuncular sarkilari anonim olarak dinler ve en begendikleri sarkiya oy verir.

## 2. Temel Terimler

- **Lobby:** Oyuncularin oyun baslamadan once toplandigi oda.
- **Session:** Lobby icinde art arda oynanacak toplam match sayisi.
- **Match:** Tum enstruman round'larinin, uc sarki playback'inin, oylamanin ve puanlamanin tamamlandigi tek oyun dongusu.
- **Instrument round:** Tek bir enstrumana ayrilan 30 saniyelik uretim asamasi.
- **Pattern:** Bir oyuncunun bir instrument round'da olusturdugu 8-step muzik verisi.
- **Song variant:** Her enstrumandan bir pattern'in birlestirilmesiyle olusan tam sarki.
- **Pattern pool:** Enstruman bazinda kullanilmayi bekleyen pattern havuzu.
- **Archive:** Aktif havuzdan cikan veya secilmeyen eski pattern'lerin saklandigi alan.
- **OG Round:** Final leaderboard beraberligini cozmek icin archive pattern'leriyle oynanan tiebreaker.

## 3. Lobby Ayarlari

- Minimum oyuncu: **4**
- Maksimum oyuncu: **10**
- Maksimum match sayisi: **5**
- Instrument round suresi: **30 saniye**
- Pattern grid'i: **8 step**
- Her match sonunda sarki varyanti: **3**
- Her instrument round'da her oyuncu bir pattern uretir.
- Session basladiginda lobby kilitlenir. Yeni oyuncu alinmaz; yalnizca mevcut oyuncular reconnect edebilir.
- Minimum 4 oyuncu yoksa session baslatilamaz.
- Session baslamadan once oyuncu eklenir veya ayrilirsa uygunluk kosullari yeniden hesaplanir.

## 4. Enstrumanlar

Ilk aday havuzunda 7 enstruman vardir. Bir lobby, her match icin en fazla 6 enstruman secebilir:

1. Kick / Drum
2. Snare / Percussion
3. Hi-hat
4. Bass
5. Chord Synth
6. Lead Synth
7. Electric Guitar

Pluck ve FX ileride eklenebilir. Enstruman listesi ve maksimum secim sayisi config'ten degistirilebilir.

Oyuncular her instrument round'da ayni enstruman icin ayri ayri pattern uretir. Ornegin 7 oyuncu Guitar round'da 7 gitar pattern'i olusturur. Oyunculara tek tek enstruman dagitilmaz ve enstruman derecesi kullanilmaz.

## 5. Pattern Uretimi

Her instrument round'da:

1. Tek bir enstruman secilir.
2. Tum oyuncular ayni anda 8-step grid'i doldurur.
3. Oyuncu pattern'i yaptigi anda sesini duyabilir.
4. `Play` pattern'i preview eder.
5. `Clear` pattern'i temizler.
6. `Lock` pattern'i gonderir ve duzenlemeyi kapatir.
7. Sure dolarsa pattern o anki haliyle kilitlenip pool'a kaydedilir.

Oyuncular diger oyuncularin pattern'lerini veya onceki katkilarini gormez ve duymaz. Bir oyuncu disconnect olsa bile sonraki instrument round'a katilabilir.

## 6. Pattern Pool

Her enstrumanin ayri bir pattern pool'u vardir. Bir match'te uretilen tum yeni pattern'ler ilgili enstrumanin pool'una eklenir.

- Her enstruman icin aktif pool limiti: **50 pattern**
- Pool limiti asilirsa pattern silinmez, archive'a tasinir.
- Secilen pattern normal akista pool'dan cikarilir ve tekrar kullanilmaz.
- Secilmeyen pattern'ler sonraki match'lere aktarilir.
- Archive pattern'leri OG Round'da kullanilabilir.
- Session'da en fazla 5 match oynanir.

Yeni pattern'lerin secilme agirligi `x1.20`, eski/archive pattern'lerin agirligi `x1.00` olur. Bu katsayi oyuncuya puan vermez; yalnizca pattern secilme olasiligini etkiler.

## 7. Uc Sarki Olusturma

Tum teorik kombinasyonlar hesaplanmaz. Her enstruman icin yalnizca 3 pattern secilir ve bunlar uc song variant'a rastgele dagitilir.

```text
Guitar: G1, G2, G3
Drums:  D1, D2, D3
Bass:   B1, B2, B3

Song 1: G1 + D3 + B2
Song 2: G3 + D1 + B1
Song 3: G2 + D2 + B3
```

Pattern'ler ayni index ile eslesmek zorunda degildir. Her song variant secilen tum enstruman katmanlarini icermelidir; hicbir katman elenmez.

## 8. Fairness Kurali

Uc sarki icindeki toplam pattern slotu:

```text
3 x secilen enstruman sayisi
```

Her oyuncunun en az bir slotta temsil edilmesi gerekir. Bu, her oyuncudan tam olarak bir pattern secilecegi anlamina gelmez; bir oyuncunun birden fazla pattern'i secilebilir.

Oyuncu sayisina gore minimum enstruman sayisi:

| Oyuncu | Minimum enstruman | Toplam slot |
|---:|---:|---:|
| 4 | 2 | 6 |
| 5 | 2 | 6 |
| 6 | 2 | 6 |
| 7 | 3 | 9 |
| 8 | 3 | 9 |
| 9 | 3 | 9 |
| 10 | 4 | 12 |

Secim sirasi:

1. Once henuz temsil edilmeyen oyuncularin uygun pattern'leri rezerve edilir.
2. Her enstruman icin en fazla 3 pattern secilir.
3. Bos kalan slotlar agirlikli rastgele secimle doldurulur.
4. Secilen pattern'ler her enstruman icinde rastgele permute edilir.
5. Uc sarkida tum oyuncularin temsil edildigi tekrar kontrol edilir.

Dusuk puanli oyuncuya ekstra secim avantaji verilmez. Rekabet, sistemin yapay telafisiyle degil pattern kalitesi ve oylamayla belirlenir.

## 9. Match Akisi

1. Secilen her enstruman icin sirayla instrument round oynanir.
2. Tum pattern'ler ilgili pool'lara kaydedilir.
3. Her enstrumandan uc pattern secilir.
4. Uc tam song variant olusturulur.
5. Sarki playback sirasi rastgele belirlenir.
6. Uc sarki anonim olarak oynatilir.
7. Oylama acilir ve oyuncular bir sarki secer.
8. Oylar hesaplanir, pattern sahiplerine puan verilir.
9. Match leaderboard'i guncellenir.
10. Session'da match kaldiysa yeni match baslar; kalmadiysa final sonucu gosterilir.

## 10. Playback ve Oylama

- Her sarki **5 loop** calar.
- 8 step ve 120 BPM varsayiminda bir loop yaklasik 2 saniyedir.
- Uc sarki sirayla oynatilir.
- Playback ekraninda yalnizca uc progress bar gorulur.
- Pattern detaylari, oyuncu isimleri ve oy sayilari playback ve oylama sirasinda gizlidir.
- Oy sayilari oylama bitene kadar gosterilmez.
- Uc playback tamamlanmadan oylama baslamaz.
- Oyuncu pattern'e degil, butun sarkiya oy verir.
- Oylama bitince `G1 + H3 + D2` gibi anonim kodlar gercek oyuncu isimlerine donusturulur.

## 11. Puanlama

- Tek bir sarki kazanirsa, o sarkida pattern'i bulunan her benzersiz oyuncu 1 puan alir.
- Ayni oyuncunun ayni kazanan sarkida birden fazla pattern'i varsa normalde yine 1 puan alir.
- Tum oylar tek sarkiya giderse kazanan sarkinin pattern sahipleri `x2` puan alir.
- `x2`, pattern basina degil oyuncu basina uygulanan normal kazancin katsayisidir.
- En yuksek oyda iki veya uc sarki berabere kalirsa yalnizca berabere kalan sarkilar puanlamaya dahil edilir.
- Berabere kalan sarkilarda bir oyuncunun kac pattern'i secildiyse o kadar puan alir.
- Leaderboard her match sonunda guncellenir.
- Katsayilar sabit kodlanmayacak, ileride config'ten okunabilir olacak.

## 12. OG Round

Session'in son match'inden sonra en yuksek skor berabereyse `Tiebreaker: OG ROUND!` baslar.

- Yalnizca berabere kalan oyuncular yarismacidir.
- Her yarismaci icin sadece kendi archive pattern'lerinden bir sarki olusturulur.
- Berabere kalan 2 oyuncu varsa 2, 3 oyuncu varsa 3 sarki uretilir.
- Normalde yarismacilar oy kullanamaz; diger lobby oyunculari oy verir.
- Lobby'deki herkes berabere kaldiysa yarismacilar rakiplerinin sarkilarina oy verebilir, kendi sarkilarina veremez.
- Beraberlik devam ederse archive'daki farkli pattern'lerle OG Round tekrarlanir.
- Birinci belirlendikten sonra yalnizca ikinci ve ucuncu arasinda beraberlik kalirsa yeni OG Round oynanmaz; kalan siralama esit kabul edilir.
- Beraberlik pratikte bitmezse berabere kalan herkes finalde gold medal alir.

Simulasyonda 3 yarismacinin OG Round beraberligi ilk turda yaklasik `%75,066`, bes tur sonrasinda hala devam etmesi `%0,098` oraninda goruldu. Ortalama tekrar sayisi `1,3325` oldu.

## 13. Ses Sistemi

- Kick, Snare, Hi-hat, Bass, Chord Synth ve Lead Synth sentez tabanli ses kullanir.
- Elektro gitar gercek kayit asset'leri kullanir.
- Gitar 6 tellidir.
- Oyuncu gitar tellerinin uzerinden cizgi gecirir.
- Cizginin tel ile kesismesi nota event'i olusturur.
- Cizginin yatay konumu 8-step zaman sistemine quantize edilir.
- Ayni step'te birden fazla tel kesilirse birden fazla nota veya strum event'i olusturulabilir.
- Perde, vibrato, bend ve gercek gitar fizigi MVP'de yoktur.
- Gitar tuning, nota dizisi ve akorlar ses tasarimi testleri sonrasinda belirlenecektir.

## 14. Sesin Calinma Yeri ve Senkron

Server ses render etmez. Server pattern referanslarini, BPM'i, playback sirasini, fazi ve baslangic zamanini yonetir. Sesler client tarafinda calar.

1. Client ses asset'lerini yukler veya sentez enstrumanlarini hazirlar.
2. Hazir oldugunu server'a bildirir.
3. Server gelecekteki ortak baslangic zamanini yayinlar.
4. Client pattern event'lerini kendi Web Audio/Tone.js clock'unda schedule eder.
5. Tum katmanlar ayni local audio clock ile baslar.

Client'lar arasinda sample seviyesinde kusursuz senkron hedeflenmez. Her oyuncunun kendi cihazinda sarki katmanlarinin uyumlu calismasi yeterlidir.

## 15. Lobby ve Baglanti Kurallari

- Kullanici ya lobby olusturur ya da lobby koduyla katilir.
- Lobby kodunu server uretir.
- MVP'de hesap, auth ve kalici profil yoktur.
- Nickname lobby icinde unique olmak zorundadir.
- Session basladiginda lobby kilitlenir.
- Session'i baslatan oyuncunun host yetkisi yoktur; server tek otoritedir.
- Session bittikten sonra ayni lobby yeniden kullanilmaz; yeni oyun icin yeni lobby acilir.
- Tum oyuncular ayrilinca lobby silinir.

## 16. Reconnect

- Reconnect countdown'i instrument round suresine esittir: **30 saniye**.
- Oyuncu round icinde koparsa countdown baslar.
- Countdown icinde donerse diger oyuncular round'un bitmesini bekler.
- Oyuncu geri dondugunde o round icin tam 30 saniye verilir.
- Bir match'te oyuncunun en fazla 2 reconnect hakki vardir.
- Reconnect sayaci her match basinda sifirlanir.
- Ilk katilim reconnect sayacini artirmaz.
- Ucuncu reconnect denemesinde oyuncu baglanir baglanmaz atilir.
- Oyuncu round'u kacirirsa o round katkisi pas gecilir; sonraki round'lara katilabilir.

## 17. Guncel MVP Sinirlari

- Kalici kullanici hesabi ve authentication yok.
- Server restart sonrasi aktif session recovery yok.
- Server tarafinda audio rendering yok.
- Gercek gitar fizigi yok; gitar interaction'i tel kesismelerine indirgenir.
- Estetik ve animasyon detaylari teknik temel oturduktan sonra belirlenecek.
- Pool, puan ve OG Round algoritmalari config'e acik tasarlanacak.


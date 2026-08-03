# Blind Beat – Oyun Kuralları

Kör oylamalı çok oyunculu müzik oyunu: oyuncular birbirinin katkılarını görmeden pattern üretir, sistem bunlardan şarkı varyantları kurar ve oyuncular kör oylamayla puan kazanır.

## Lobby ve Session

- Lobby 4–10 oyuncu içindir. Session başlayınca kilitlenir.
- Oyuncu **nickname** ile katılır; aynı lobby içinde nickname benzersizdir. Hesap/auth yoktur.
- Bir session, art arda oynanan toplam match sayısıdır (maks 5).
- En az 4 oyuncu olmadan session başlamaz.

## Maç Akışı

1. Seçilen her enstrüman için **instrument round** oynanır.
2. Her oyuncu bir **pattern** üretir; diğer oyuncuların pattern'lerini görmez/duymaz.
3. Pattern'ler ilgili enstrümanın havuzuna kaydedilir.
4. Her enstrüman havuzundan 3 pattern seçilir ve 3 **song variant** oluşturulur.
5. Üç şarkı rastgele sırayla, 5 loop dinletilir.
6. Oyuncular tek bir şarkıya oy verir; sonuç açıklanır.
7. Skorlar leaderboard'a yansır; kalan match varsa sıradakine geçilir.

## Pattern Pool

- Her enstrümanın ayrı havuzu vardır, aktif limit **50 pattern** (taşan archive'a gider).
- Seçilen pattern havuzdan çıkar; seçilmeyenler sonraki match'lere kalır.
- Archive pattern'leri yalnızca **OG Round**'da kullanılır.

## Şarkı Üretimi ve Fairness

- Her enstrüman havuzundan 3 pattern seçilir, enstrüman bazında karıştırılarak 3 şarkıya dağıtılır (ör. `Song 1 = G1 + H3 + D2`).
- Her oyuncunun en az bir şarkıda temsil edilmesi garanti edilir.
- Kural: `3 x seçilen enstrüman sayısı >= oyuncu sayısı`. (4–6 oyuncu → 2 enstrüman, 7–9 → 3, 10 → 4.)

## Oylama ve Puanlama

- Playback tamamlanmadan oylama başlamaz; oy sayıları bitişe kadar gizlidir.
- Kazanan şarkıdaki her benzersiz oyuncu **1 puan**; tüm oylar tek şarkıya giderse **x2** puan.
- Berabere kalırsa yalnızca berabere kalan şarkılar puanlanır; oyuncu seçilen pattern sayısı kadar puan alır.
- Leaderboard her match sonunda güncellenir.

## Tiebreaker – OG Round

- Final skorda beraberlik varsa yalnızca berabere kalanlar için kendi archive pattern'lerinden şarkılar kurulur.
- Yarışçılar oy veremez (hepsi berabereyse rakiplerin şarkısına oy verir, kendi şarkısına değil).
- Beraberlik bitene kadar farklı pattern'lerle tekrarlanır.

## Reconnect

- Reconnect süresi = round süresi (30 sn), match başına **2 hakkı** vardır.
- Dönen oyuncu o round için tam 30 sn alır; diğerlerinin süresi etkilenmez.

## Oyun Sonu

Session bittiğinde birinci/ikinci/üçüncü madalya ile sonuç ekranı gösterilir.

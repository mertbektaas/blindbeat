# Blind Beat

Blind Beat, oyuncuların diğer oyuncuların katkılarını duymadan müzik patternleri oluşturduğu çok oyunculu bir müzik oyunudur. Sistem, oyuncuların katkılarını birleştirerek farklı şarkı varyantları üretir ve oyuncular bu şarkıları anonim olarak oylayarak puanlar.

## Oyun Özeti

- Lobbyler 4 ile 10 oyuncu arasında kurulabilir.
- Oyuncular seçilen her enstrüman için 30 saniyelik bir instrument round oynar.
- Her oyuncu 8 step üzerinden kendi patternini oluşturur.
- Sistem pattern pool içinden üç farklı şarkı varyantı üretir.
- Şarkılar oyuncu katkıları gösterilmeden dinletilir ve blind voting yapılır.
- Match sonunda puanlar leaderboarda yansır.
- Final beraberliklerinde archive patternleriyle OG Round oynanır.

## Teknik Özet

- Vue.js ve Vite ile ayrı frontend
- Node.js ve Express ile backend
- Canlı oyun akışı için native WebSocket
- Kalıcı veriler için PostgreSQL ve Prisma
- Frontend, backend ve PostgreSQL için Docker Compose
- Pattern verileri JSONB formatında saklanır.
- REST API kalıcı kaynakları, WebSocket ise canlı oyun olaylarını yönetir.
- Oyun stateinin ve kritik kararların otoritesi serverdadır.

## Mevcut Durum

Oyun kuralları ve teknik mimari tasarım aşamasında netleştirilmiştir. Sentez sesleri için çalışan bir prototip `test/index.html` içinde bulunmaktadır. Uygulama geliştirmesine Docker, PostgreSQL, Prisma ve temel backend bağlantısıyla başlanacaktır.

## Dokümantasyon

- [Oyun kuralları ve güncel tasarım](docs/gamerules.md)
- [Teknik mimari](docs/technical.md)




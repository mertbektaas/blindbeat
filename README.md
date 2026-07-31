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
- Tüm matchler bittiğinde final session result ekranı gösterilir.

## Teknik Özet

- Vue.js 3 + Vite + Pinia frontend
- Node.js 22 + Express 5 + native WebSocket backend
- PostgreSQL 16 + Prisma ORM
- Docker Compose (development + production)
- Pattern verileri JSONB formatında saklanır.
- REST API kalıcı kaynakları, WebSocket canlı oyun olaylarını yönetir.
- Oyun state’inin ve kritik kararların otoritesi serverdadır.

## Geliştirme

```bash
cp .env.example .env
# .env'i kendi local değerlerinle doldur

docker compose up -d --build
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3000/api`

## Production Deploy

[DEPLOY.md](DEPLOY.md) dosyasına bakın.

## Dokümantasyon

- [Oyun kuralları ve güncel tasarım](docs/gamerules.md)
- [Teknik mimari](docs/technical.md)

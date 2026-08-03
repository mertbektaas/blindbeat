# Blind Beat

Çok oyunculu, oylamalı bir müzik oyunudur. Oyuncular diğer pattern'leri görmeden müzik pattern'leri oluşturur; sistem bu pattern'leri birleştirip üç şarkı varyantı üretir ve oyuncular bunları anonim olarak oylayıp puan kazanır.

## Nasıl çalışır

- Lobiler 4–10 oyuncu arasında kurulur.
- Her match'te seçilen enstrümanlar için instrument round'lar oynanır; her oyuncu bir pattern üretir.
- Sistem pattern'lerden üç şarkı varyantı üretir (fairness + ağırlıklı seçim).
- Şarkılar katkı sahipleri belli edilmeden dinletilir ve kör oylama yapılır.
- Skorlar leaderboard'a yansır; final beraberliklerinde yedek pattern'lerle OG Round oynanır.

## Teknoloji

- **Frontend:** Vue 3 + Vite + Pinia + Tone.js
- **Backend:** Node.js + Express 5 + native WebSocket
- **Veritabanı:** PostgreSQL 16 + Prisma (pattern verileri JSONB)
- **Orkestrasyon:** Docker Compose

## Hızlı Başlangıç

```bash
cp .env.example .env        # local değerlerini yaz
docker compose up -d --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

## Dökümantasyon

- **[Geliştirici Dokümanı](docs/DEVELOPMENT.md)** — mimari, veri modeli, oyun durum makinesi, WebSocket protokolü ve genişletme noktaları.
- **[Oyun Dokümanı](docs/gamerules.md)** — oyun kuralları.
- **[Teknik Tasarım](docs/technical.md)** — teknik mimari kararları.

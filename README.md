# Bocchi

Advanced, modular Discord bot for community management:

- Anti-raid, anti-nuke, anti-spam, anti-alt, risk scoring, and lockdown protections
- Anti-phishing, anti-alt, rollback, and risk support
- Music playback, filters, playlists, and favorites
- Ticket and partnership systems
- Welcome flow, autorole, and verification
- Leveling, profiles, badges, and daily tasks
- Logging, moderation cases, appeals, and backups
- Invite tracking, giveaways, announcements, and polls
- Economy, inventory, coinflip, and clan basics
- Optional SQLite storage, web dashboard, and AI support assistant
- Temporary voice rooms and server stat channels
- Event RSVPs, partner renewals, moderator analytics, and auto punishment escalation
- Scam text shield, moderator audit, and advanced server snapshots
- Ticket v2, applications, suggestions/complaints, and staff performance scoring
- Weekly reports, permission audits, custom commands, and production heartbeat checks

## Setup

1. Install Node.js `20+`.
2. In this folder run:

```powershell
npm install
```

3. Copy `.env.example` to `.env` and fill in the values.
4. Start the bot:

```powershell
npm run start
```

Environment validation:

```powershell
npm run validate:env
```

Windows shortcut:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1 -RunChecks -RunTests
```

## Validation

```powershell
npm run check
npm test
```

## Production

PM2:

```powershell
pm2 start ecosystem.config.cjs
```

Docker:

```powershell
docker compose up -d --build
```

Healthcheck:

```powershell
npm run healthcheck
```

## Notes

- Music uses `discord-player`.
- Slash commands are registered automatically when the bot starts.
- The default security posture is intentionally strict; tune it with `/guvenlik-kur`.
- `/guvenlik-paneli` icindeki `Izin Denetimi` ve `Prod Durumu` butonlariyla hizli kontrol yapabilirsin.
- `setup-sihirbazi` temel topluluk kanallari, ticket v2, haftalik rapor ve panelleri otomatik kurar.
- Haftalik rapor ayari `/topluluk-kur` icinden yapilabilir.
- Docker `compose.yaml` log rotation ve healthcheck ile gelir.
- Slash command names are Turkish, but use ASCII letters for Discord compatibility.
- `DATABASE_MODE=sqlite` ayarlarsan `better-sqlite3` ile SQLite depolamasi kullanir; aksi halde JSON ile devam eder.
- `DASHBOARD_ENABLED=true` ile Express tabanli dashboard acilir.
- Dashboard health endpoint: `/health`
- Dashboard detay sayfasi: `/guilds/<guildId>?token=...`
- `AI_ENABLED=true` ve `OPENAI_API_KEY` girersen AI destek komutlari aktif hale gelir.
- GitHub Actions CI dosyasi: `.github/workflows/ci.yml`

## Core Commands

- `/yardim`
- `/guvenlik-kur`
- `/guvenlik-paneli`
- `/topluluk-kur`
- `/muzik-kur`
- `/guvenli-liste`
- `/kilit`
- `/jail`
- `/gecici-jail`
- `/jail-kaldir`
- `/timeout`
- `/at`
- `/banla`
- `/uyar`
- `/cezalar`
- `/risk`
- `/ceza-merdiveni`
- `/moderator-raporu`
- `/yetkili-denetim`
- `/guvenlik-raporu`
- `/yedek-al`
- `/yedekler`
- `/yedek-yukle`
- `/snapshot-al`
- `/snapshotlar`
- `/snapshot-yukle`
- `/itiraz-kanali`
- `/ai-kur`
- `/ticket-paneli`
- `/rol-paneli`
- `/cekilis`
- `/davetler`
- `/partnerlik-kur`
- `/partnerlik-paneli`
- `/partnerlik-istatistik`
- `/partnerler`
- `/partner-kara-liste`
- `/partner-yenile`
- `/etkinlik-olustur`
- `/etkinlikler`
- `/profil`
- `/bio`
- `/rozetler`
- `/gorevler`
- `/anket`
- `/duyuru`
- `/duyuru-planla`
- `/itiraz`
- `/ai-sor`
- `/bakiye`
- `/gunluk`
- `/calis`
- `/market`
- `/satin-al`
- `/envanter`
- `/yazi-tura`
- `/klan-kur`
- `/klan-katil`
- `/para-gonder`
- `/oynat`
- `/gec`
- `/duraklat`
- `/devam`
- `/durdur`
- `/kuyruk`
- `/simdicalan`
- `/ses`
- `/dongu`
- `/muzik-filtre`
- `/muzik-otomatik`
- `/muzik-247`
- `/playlist-kaydet`
- `/playlistler`
- `/playlist-oynat`
- `/favori-ekle`
- `/favoriler`
- `/favori-oynat`
- `/hatirlat`
- `/ayarlar`

## Project Layout

- `src/commands`: Slash commands
- `src/events`: Discord events
- `src/modules`: Feature modules
- `src/utils`: Helpers
- `data`: JSON storage

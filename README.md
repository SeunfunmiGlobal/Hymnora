# Hymnora by Clouddice Digital

**Worship Without Limits. Scripture Without Boundaries.**

Hymnora is a responsive church ministry workspace prototype combining worship lyric presentation, Bible passage discovery, church events and attendee registration, community follow-up and social publishing planning.

## Included in this release

- Worship Studio: song library, song metadata, authorized lyric entry, multi-slide lyric preview and full-screen projector mode.
- Scripture Intelligence: sermon notes/keyword analysis through a structured AI extraction endpoint that suggests Bible references, themes and explanations.
- Events & Tickets: create programmes and collect registrations.
- Registration fields: full name, email, phone, WhatsApp, area of residence, nearest bus stop, selected programme, referral source and explicit contact consent.
- People & Follow-up: attendee overview, consent visibility and CSV-ready export text.
- Social Publisher: connection planning for Instagram, Facebook, TikTok, YouTube, Spotify, X and Threads.
- PWA manifest and service worker for browser installation on supported devices.

## Stack

- React + Vite + TypeScript
- AppDeploy backend routes
- AppDeploy database
- AppDeploy AI structured extraction
- PWA manifest / service worker

## Local development

Install dependencies and run the Vite dev server:

```bash
npm install
npm run dev
```

## Important production requirements

1. **Lyrics rights:** Do not scrape or reproduce copyrighted song lyrics without permission. Use public-domain works, original church compositions, licensed catalogues, or lyrics supplied by a church that has verified display rights. A full global catalogue requires licensing/provider agreements.
2. **Bible translations:** This release returns references and study explanations, not full translation text. Connect a Bible API or licensed translation provider for full verse display.
3. **Social media:** The UI lists platform integrations, but OAuth/API publishing is not active yet. Each platform requires developer registration, app review, approved scopes and securely configured credentials. Supported post types and restrictions differ by platform.
4. **Email/SMS/WhatsApp:** Contact records are collected only with explicit consent. Bulk messaging requires an approved provider, sender verification, opt-out handling, rate limits and applicable privacy compliance.
5. **Security:** This first release is a functional prototype. Before public church-wide use, add authenticated church workspaces, role-based access, tenant isolation, audit logs, encryption/retention policies, anti-spam controls, CAPTCHA/rate limits and export/deletion workflows.
6. **Native installers:** The PWA can be installed from supported browsers on Windows, macOS, Android and iOS/iPadOS (iOS uses Add to Home Screen). Dedicated signed Windows/macOS installers and native mobile store apps are a later packaging/release phase.

## Main API routes

- GET/POST /api/songs
- GET/POST /api/events
- GET/POST /api/registrations
- POST /api/scripture/suggest
- GET /api/_healthcheck

## Product roadmap

- Authenticated multi-church tenancy and role permissions.
- Licensed lyric provider and song recognition integrations.
- Live speech transcription and scripture cueing during sermon ministration.
- Bible translation provider and verse display.
- Social OAuth integrations and scheduling.
- Email, SMS and WhatsApp provider integrations.
- QR tickets, check-in, attendance and follow-up automation.
- Dedicated desktop wrappers and app store packaging.

Built by **Clouddice Digital**.

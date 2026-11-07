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

## Commercial model

Hymnora uses a hybrid commercial model under Clouddice Digital: a free tier, paid Starter, Professional and Enterprise plans, plus a 30-day trial for newly created church workspaces. The application currently records plan requests but does not collect payments. Stripe or another supported payment provider, webhook verification, invoices, tax handling, renewals, cancellations and paid-feature enforcement must be configured and tested before commercial billing is enabled.

## Integration status and roadmap

- **Implemented foundation:** authenticated multi-church workspaces, role permissions, invitation links, protected APIs, attendee consent, privacy export/deletion and basic anti-spam controls.
- **Billing foundation:** hybrid plan catalogue, 30-day trial metadata and owner-only plan requests. Payment checkout is not connected.
- **Lyrics:** licensed lyric provider and song recognition integrations. Do not scrape or reproduce copyrighted song lyrics without permission.
- **Live worship and scripture:** speech transcription, lyric cueing, Bible translation provider and verse display.
- **Social publishing:** OAuth integrations and scheduling for Meta, TikTok, YouTube, Spotify, X and Threads. Each provider requires app registration, review, scopes and credentials.
- **Communications:** email, SMS and WhatsApp provider integrations, verified sender identities, opt-out handling and consent enforcement.
- **Events:** QR tickets, check-in, attendance and follow-up automation.
- **Distribution:** dedicated signed Windows/macOS installers and Android/iOS store packaging. The existing PWA is the current installable option.

## Production release gates

Before paid launch, complete payment-provider integration and webhook tests; independent security review and tenant-isolation tests; CAPTCHA and durable rate-limit validation; retention/deletion policies; privacy notices and terms; and provider-specific approval for lyrics, Bible text, social publishing and messaging.

Built by **Clouddice Digital**.

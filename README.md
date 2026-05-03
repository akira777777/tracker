# Transparent Tracker

Transparent campaign click analytics built with Next.js, Prisma, and SQLite.

The public tracking route shows a compact notice before any event is recorded. A click event is written only after the visitor presses `Продолжить`.

## Setup

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/admin`.

## Environment

Copy `.env.example` to `.env` and update the values:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-this-password"
AUTH_SECRET="replace-with-a-long-random-string"
IP_HASH_SALT="replace-with-a-different-long-random-string"
ANALYTICS_RETENTION_DAYS="30"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Behavior

- `/admin` is protected by an HTTP-only signed cookie.
- `/t/[slug]` displays the transition page and the 12px privacy notice.
- `POST /api/events` records the event and redirects to the campaign target URL.
- Raw IP addresses are not stored. The database stores an HMAC hash, a truncated IP, approximate geo fields, and browser summary data.
- Old events are removed according to `ANALYTICS_RETENTION_DAYS`.

## Checks

```bash
npm run lint
npm run build
```

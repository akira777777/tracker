# Transparent Tracker

Transparent Tracker - приложение для прозрачной аналитики переходов по кампаниям. Публичный tracking route показывает короткое уведомление о приватности до записи события; событие клика сохраняется только после нажатия `Продолжить`.

## Стек

- Next.js 16 App Router, React 19, TypeScript.
- Prisma 7 с SQLite и `@prisma/adapter-better-sqlite3`.
- Tailwind CSS 4, ESLint 9, Prettier 3.
- npm и `package-lock.json`.
- Docker для production-запуска с SQLite volume.

## Требования

- Node.js 24.x рекомендуется для локальной разработки и CI.
- npm 10+.
- Docker и Docker Compose для контейнерного запуска.

## Установка

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Откройте `http://localhost:3000`. Корневой route перенаправляет на `/admin`.

## Переменные окружения

Next.js читает `.env*` из корня проекта. Файлы `.env`, `.env.local` и локальные SQLite DB не коммитятся.

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-this-password"
AUTH_SECRET="replace-with-a-long-random-string"
IP_HASH_SALT="replace-with-a-different-long-random-string"
ANALYTICS_RETENTION_DAYS="30"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Для Docker production используется SQLite volume и значение `DATABASE_URL="file:/app/data/prod.db"`.

## Локальная разработка

```bash
npm run dev
```

Основные routes:

- `/admin` - административный интерфейс, защищен HTTP-only signed cookie.
- `/login` - вход в админку.
- `/t/[slug]` - transition page с privacy notice.
- `/api/events` - запись события и redirect на target URL кампании.
- `/privacy` - страница с описанием приватности.

## Prisma и база данных

```bash
npm run db:generate  # сгенерировать Prisma client в src/generated/prisma
npm run db:migrate   # локальные dev migrations
npm run db:deploy    # применить migrations в production/CI
npm run db:studio    # Prisma Studio
```

`src/generated/prisma` генерируется Prisma и не редактируется вручную.

## Docker

Production image собирается через standalone output Next.js. SQLite база хранится в Docker volume `tracker-data`.

```bash
ADMIN_PASSWORD="secure-password" \
AUTH_SECRET="long-random-auth-secret" \
IP_HASH_SALT="long-random-ip-salt" \
NEXT_PUBLIC_APP_URL="http://localhost:3000" \
docker compose up --build -d
```

При старте контейнера выполняется `npm run db:deploy`, затем запускается standalone server `node server.js`.

## Scripts

```bash
npm run dev           # dev server
npm run build         # production build
npm run start         # next start для локальной проверки build
npm run lint          # ESLint
npm run format        # Prettier write
npm run format:check  # Prettier check
npm run typecheck     # TypeScript noEmit
npm run db:generate   # Prisma generate
npm run db:migrate    # Prisma migrate dev
npm run db:deploy     # Prisma migrate deploy
npm run db:push       # Prisma db push
npm run db:studio     # Prisma Studio
```

## Качество кода

- ESLint использует `eslint-config-next/core-web-vitals` и TypeScript rules.
- Prettier настроен через `.prettierrc`; generated Prisma client, DB файлы и build артефакты исключены.
- VS Code workspace рекомендует ESLint, Prettier, Tailwind CSS и Prisma extensions.

Перед PR рекомендуется выполнить:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## CI/CD

CI workflow `.github/workflows/ci.yml` запускает:

- `npm ci`
- `npm run db:generate`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Deploy workflow `.github/workflows/deploy.yml` - безопасный manual template (`workflow_dispatch`) для Docker/VPS deployment. Он не запускается автоматически и требует GitHub Secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`

На сервере должны быть Docker, Docker Compose и production env-переменные для `docker-compose.yml`.

## Архитектура директорий

```text
src/app/                 App Router pages и route handlers
src/app/admin/           админка и server actions
src/app/api/             API endpoints
src/app/t/[slug]/        публичная transition page кампании
src/components/          reusable UI components
src/lib/                 auth, config, db, tracking, validation
src/generated/prisma/    generated Prisma client, не редактировать вручную
prisma/                  Prisma schema и migrations
.github/workflows/      CI и manual deploy template
.vscode/                workspace настройки IDE
```

## Git workflow

- Работайте в feature branch.
- Не коммитьте `.env*`, локальные DB, `.next`, `node_modules` и generated Prisma client.
- Перед merge запускайте проверки качества и build.
- Миграции Prisma коммитьте вместе с изменениями schema.

## Security notes

- Raw IP addresses не сохраняются: приложение хранит HMAC hash, truncated IP, примерные geo fields и browser summary.
- `AUTH_SECRET`, `IP_HASH_SALT` и `ADMIN_PASSWORD` должны быть уникальными и длинными в production.
- `NEXT_PUBLIC_*` переменные попадают в клиентский bundle на build-time, не храните там секреты.
- Старые события очищаются согласно `ANALYTICS_RETENTION_DAYS`.

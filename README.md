# Frontend template

Reusable Next.js (App Router) starter with Tailwind CSS, Docker, and GitLab CI.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customize for a new project

1. Rename the app in `package.json`, and update the site name, description and metadata in `src/app/layout.tsx`.
2. Replace `src/app/page.tsx` with your product UI.
3. Add routes under `src/app`.
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL`.
5. Drop product assets into `public/`.
6. In GitLab, set `CI_NPM_REGISTRY`, `PROD_SERVER` and `PROD_PRIVATE_KEY`, and check the project path in `deploy/prod_update.sh`.

Shared and dashboard-specific components are not part of the template yet; they will be added under `src/components`.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS v4
- Docker / docker-compose
- GitLab CI with a manual production deploy job

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Docker

```bash
docker compose up --build
```

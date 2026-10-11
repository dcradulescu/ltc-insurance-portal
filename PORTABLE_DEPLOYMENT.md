> Historical source document. Current verified status and exceptions are in DEVELOPMENT_2026-10-08.md; current setup is in START_HERE.md. Any older completion, security, delivery or test claims below are not current verification.

# LTC Insurance Portal — Portable Deployment

## Status

This workspace is the provider-independent migration build of the LTC Insurance Portal.
The application source, recovered media, SQL migrations, PDF logic, React frontend,
Express/tRPC backend, and Drizzle/MySQL layer are included.

## What was converted

- Removed the former platform Vite runtime/debug integration.
- Removed the former platform OAuth/network dependency from request authentication.
- Replaced platform object storage with S3-compatible storage.
- Replaced platform AI routing with a configurable OpenAI-compatible chat-completions endpoint.
- Replaced platform owner notifications with SMTP email.
- Replaced all known hosted media URLs with bundled local media.
- Normalized seven recovered PNG images that had been mislabeled with `.jpg` extensions.
- Removed provider-specific CORS hosts, SEO hostnames, sitemap entries, and privacy/profile copy.
- Removed `.project-config.json` from this portable package because the source copy contained live credentials.
- Added `.env.example`, Dockerfile, Docker Compose example, `/healthz`, and dynamic sitemap/robots generation.

## Critical item not contained in this package

**The live production database rows are not present in the source backup.**
The existing Drizzle schema and migrations are included, but policies, strategies,
contacts, chat history, uploaded-document metadata, checklist progress, and other live
rows must be exported from the current MySQL/TiDB database separately before the old
account is removed.

Recommended artifact name:

`ltc-portal-database-2026-08-12.sql`

Capture structure + data for every application table. A helper is included:

```bash
DATABASE_URL="mysql://..." pnpm db:export
```

It invokes `mysqldump` without printing the database password. Run it on a machine that has the MySQL client installed and network access to the live database.

## Media status

Recovered media is under:

- `client/public/media/core/`
- `client/public/media/cdn/`

The original `education-video.mp4` was not present in the backup. To prevent a broken
player, the Education page temporarily uses the recovered Academy explainer video as a
migration fallback. Replace it with the original Education video later if that file is
recovered.

Several additional CloudFront-hosted images were referenced by the source but were not
present in the supplied media ZIP. Those references were replaced with semantically
matching recovered local assets so the migrated application no longer depends on that CDN.

## Deploy

1. Copy `.env.example` to `.env` and fill in real values.
2. Create/import the MySQL-compatible database.
3. Create the S3-compatible bucket and credentials.
4. Configure SMTP and `NOTIFY_OWNER_EMAIL`.
5. Configure the AI endpoint/key/model if strategy generation is required.
6. Install and build:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:push
pnpm build
pnpm start
```

Or build with Docker:

```bash
docker build \
  --build-arg VITE_PUBLIC_URL=https://your-domain.example \
  -t ltc-insurance-portal .

docker run --env-file .env -p 3000:3000 ltc-insurance-portal
```

Health check: `GET /healthz`

## Production validation gate

Before cutover, verify all of the following:

- Home, Education, Academy, Policy Form, Strategy, Contact, Privacy and Terms render.
- All bundled images and four recovered MP4 files load.
- Policy intake writes to the migrated database.
- Strategy generation succeeds through the configured AI API.
- PDF creation/download succeeds and uploaded/generated objects persist in S3.
- Email notifications and user delivery routes succeed over SMTP/Zapier as applicable.
- SMS succeeds if Twilio is enabled.
- Saved/resume links work after a restart.
- `robots.txt`, `sitemap.xml`, canonical URL and social metadata show the production domain.
- No old-platform credentials are copied into Git or the new host.
- Old database/API/JWT credentials are rotated after cutover.

## Security

The untouched original backup should remain private. It contains credential material.
This portable package intentionally excludes `.project-config.json` and contains only
placeholder values in `.env.example`.

# LTC Insurance Portal — Environment Variables Reference

This document lists all environment variables required to run the LTC Insurance Portal.
When migrating to a new host, create a `.env` file with these values.

**DO NOT commit `.env` with real values to version control.**

---

## Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL-compatible connection string | `mysql://user:pass@host:port/dbname?ssl={"rejectUnauthorized":true}` |

## Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT secret for signing session cookies (64+ random chars) | `a1b2c3d4...` |
| `OAUTH_SERVER_URL` | OAuth backend base URL | `https://api.manus.im` |
| `VITE_APP_ID` | OAuth application ID | `7PNQfuuwdux64rdnaX8mmg` |
| `VITE_OAUTH_PORTAL_URL` | OAuth login portal URL (frontend) | `https://login.manus.im` |

## Owner Info

| Variable | Description | Example |
|----------|-------------|---------|
| `OWNER_OPEN_ID` | Owner's unique identifier | `S54c9Q9FBdPxtZFyxQ7oTU` |
| `OWNER_NAME` | Owner's display name | `Daniel` |

## LLM / AI Integration

| Variable | Description | Example |
|----------|-------------|---------|
| `BUILT_IN_FORGE_API_URL` | LLM API endpoint (server-side) | `https://forge-api.example.com` |
| `BUILT_IN_FORGE_API_KEY` | LLM API bearer token (server-side) | `sk-...` |
| `VITE_FRONTEND_FORGE_API_KEY` | LLM API token for frontend | `pk-...` |
| `VITE_FRONTEND_FORGE_API_URL` | LLM API URL for frontend | `https://forge-api.example.com` |

## PDF Generation

| Variable | Description | Example |
|----------|-------------|---------|
| `PDFMONKEY_API_KEY` | PDFMonkey API key (https://pdfmonkey.io) | `BHvw...` |

## Email / Notifications

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ZAPIER_WEBHOOK_URL` | Zapier webhook URL for email delivery | `https://hooks.zapier.com/hooks/catch/...` |

## Analytics

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ANALYTICS_ENDPOINT` | Analytics collection endpoint | `https://analytics.example.com` |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website identifier | `abc123` |

## App Branding

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_TITLE` | Application title displayed in browser | `LTC Insurance Portal` |
| `VITE_APP_LOGO` | URL to application logo | `https://cdn.example.com/logo.png` |

---

## Migration Notes

If migrating away from Manus hosting, you will need to replace:

### 1. Database
Set up a MySQL-compatible database (AWS RDS, PlanetScale, TiDB, etc.) and update `DATABASE_URL`.

### 2. Authentication
Replace Manus OAuth with your own auth solution:
- Options: Auth0, Clerk, Firebase Auth, or custom JWT
- Update `server/_core/oauth.ts` and related files
- Remove `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` references

### 3. LLM / AI
Replace Manus Forge with OpenAI or another provider:
- Update `server/_core/llm.ts` to use OpenAI SDK
- Replace `BUILT_IN_FORGE_API_URL/KEY` with `OPENAI_API_KEY`

### 4. File Storage
Replace Manus storage with S3-compatible service:
- Update `server/storage.ts` with your S3 credentials
- Add: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Re-upload all `/manus-storage/` files to your bucket
- Update all CDN URLs in source code

### 5. Media Files
All media files are in `backup-media/` directory:
- `backup-media/cdn/` — 12 files (images + videos from CDN)
- `backup-media/manus-storage/` — 8 files (logos, hero images, favicon)
- Upload these to your new storage and update URLs in source code

### 6. Vite Plugin
Remove `vite-plugin-manus-runtime` from `vite.config.ts`.

### 7. Email
Keep Zapier webhook or replace with:
- SendGrid, Mailgun, or direct SMTP
- Update email sending logic in `server/routers.ts`

---

## Security Reminders

After migration:
1. Rotate the database password/credential
2. Rotate the PDF service API credential
3. Rotate JWT/session secrets
4. Replace/rotate Manus Forge credentials
5. Replace the Zapier webhook URL if exposed
6. Review all integration credentials before deployment

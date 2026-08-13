# LTC Insurance Portal — Complete Deployment & Implementation Guide

**Document Version:** 1.0  
**Date:** August 13, 2026  
**Prepared for:** Daniel Radulescu, SC Visiting Angels  
**Prepared by:** Manus AI  

---

## Table of Contents

1. [Technology Stack Overview](#1-technology-stack-overview)
2. [System Requirements](#2-system-requirements)
3. [External Services Required](#3-external-services-required)
4. [Hosting Options Comparison](#4-hosting-options-comparison)
5. [Option A: Railway (Recommended)](#5-option-a-railway-recommended)
6. [Option B: Render](#6-option-b-render)
7. [Option C: DigitalOcean App Platform](#7-option-c-digitalocean-app-platform)
8. [Option D: AWS Lightsail (Self-Managed VPS)](#8-option-d-aws-lightsail-self-managed-vps)
9. [Option E: Hostinger VPS (Budget)](#9-option-e-hostinger-vps-budget)
10. [Database Setup](#10-database-setup)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Pre-Deployment Checklist](#12-pre-deployment-checklist)
13. [Post-Deployment Verification](#13-post-deployment-verification)
14. [Manus Dependency Removal Guide](#14-manus-dependency-removal-guide)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Technology Stack Overview

The LTC Insurance Portal is a full-stack JavaScript/TypeScript application with the following architecture:

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.x | User interface |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Routing** | Wouter | latest | Client-side routing |
| **Backend** | Express.js | 4.x | HTTP server |
| **API Layer** | tRPC | 11.x | Type-safe API communication |
| **Database ORM** | Drizzle ORM | latest | Database queries and schema |
| **Database** | MySQL 8.0 (TiDB) | 8.0+ | Relational data storage |
| **Build Tool** | Vite | 6.x | Frontend bundling and dev server |
| **Runtime** | Node.js | 22.x | Server-side JavaScript |
| **Package Manager** | pnpm | 9.x | Dependency management |
| **PDF Generation** | PDFMonkey | API | Professional PDF reports |
| **Email** | Zapier Webhook | API | Email delivery |
| **AI/LLM** | OpenAI-compatible | API | Chat and strategy generation |
| **File Storage** | S3-compatible | API | Document and image storage |

---

## 2. System Requirements

### Minimum Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 512 MB | 2 GB |
| **Storage** | 5 GB | 20 GB |
| **Node.js** | 20.x | 22.x |
| **OS** | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 |

### Required Software

```bash
# Node.js 22.x
# pnpm 9.x
# MySQL client (for database migrations)
# Git
```

---

## 3. External Services Required

These services must be set up regardless of which hosting provider you choose:

| Service | Purpose | Free Tier | Paid Tier | Sign-Up URL |
|---------|---------|-----------|-----------|-------------|
| **PDFMonkey** | PDF report generation | 50 docs/month | $15/mo (300 docs) | https://www.pdfmonkey.io |
| **Zapier** | Email delivery webhook | 100 tasks/month | $19.99/mo (750 tasks) | https://zapier.com |
| **OpenAI** | AI chat & strategy | Pay-per-use | ~$5-20/mo typical | https://platform.openai.com |
| **S3 Storage** | File/image hosting | Varies by provider | ~$5/mo | Provider-dependent |
| **MySQL Database** | Data persistence | TiDB free tier | $7-19/mo | See Section 10 |
| **Auth Provider** | User authentication | Varies | Varies | See Section 14 |

### Estimated Monthly Costs (All Services)

| Usage Level | Hosting | Database | Services | Total |
|-------------|---------|----------|----------|-------|
| **Low** (< 50 users) | $5-7 | $0 (free tier) | $15-20 | **$20-27/mo** |
| **Medium** (50-500 users) | $25 | $15-19 | $40-60 | **$80-104/mo** |
| **High** (500+ users) | $50+ | $50+ | $100+ | **$200+/mo** |

---

## 4. Hosting Options Comparison

| Feature | Railway | Render | DigitalOcean | AWS Lightsail | Hostinger VPS |
|---------|---------|--------|--------------|---------------|---------------|
| **Starting Price** | $5/mo | $7/mo | $6/mo | $5/mo | $4/mo |
| **Deploy Method** | Git push | Git push | Git push | Manual/Script | Manual/Script |
| **Auto-scaling** | Yes | Yes | Yes | No | No |
| **Built-in MySQL** | Yes | No (Postgres) | Yes | No | No |
| **SSL/TLS** | Auto | Auto | Auto | Manual | Manual |
| **Custom Domains** | Yes | Yes | Yes | Yes | Yes |
| **Docker Support** | Yes | Yes | Yes | Yes | Yes |
| **Difficulty** | Easy | Easy | Medium | Hard | Hard |
| **One-Click Deploy** | Yes | Yes | Yes | No | No |
| **Best For** | Quick start | Predictable cost | Full control | AWS ecosystem | Budget |

---

## 5. Option A: Railway (Recommended)

Railway offers the simplest deployment with built-in MySQL support and Git-based deploys.

### Pricing
- **Hobby Plan:** $5/month + usage (includes $5 credit)
- **Pro Plan:** $20/month + usage (team features)
- **MySQL Add-on:** Included in usage pricing (~$2-5/mo for small DB)

### One-Click Deployment Script

Create a file called `deploy-railway.sh`:

```bash
#!/bin/bash
# ============================================================
# LTC Insurance Portal — Railway One-Click Deploy
# ============================================================
# Prerequisites: 
#   - Railway CLI installed: npm install -g @railway/cli
#   - Railway account: https://railway.app
#   - GitHub repo connected
# ============================================================

set -e

echo "🚂 LTC Insurance Portal — Railway Deployment"
echo "=============================================="

# Step 1: Login to Railway
echo "Step 1: Authenticating with Railway..."
railway login

# Step 2: Initialize project
echo "Step 2: Creating Railway project..."
railway init --name ltc-insurance-portal

# Step 3: Add MySQL database
echo "Step 3: Provisioning MySQL database..."
railway add --plugin mysql

# Step 4: Set environment variables
echo "Step 4: Configuring environment variables..."
echo "Please enter your environment values:"

read -p "PDFMonkey API Key: " PDFMONKEY_KEY
read -p "Zapier Webhook URL: " ZAPIER_URL
read -p "OpenAI API Key: " OPENAI_KEY
read -p "JWT Secret (or press Enter to auto-generate): " JWT_SEC

if [ -z "$JWT_SEC" ]; then
  JWT_SEC=$(openssl rand -hex 32)
  echo "  Generated JWT Secret: $JWT_SEC"
fi

railway variables set PDFMONKEY_API_KEY="$PDFMONKEY_KEY"
railway variables set VITE_ZAPIER_WEBHOOK_URL="$ZAPIER_URL"
railway variables set OPENAI_API_KEY="$OPENAI_KEY"
railway variables set JWT_SECRET="$JWT_SEC"
railway variables set NODE_ENV="production"
railway variables set VITE_APP_TITLE="LTC Insurance Portal"

# Step 5: Deploy
echo "Step 5: Deploying application..."
railway up --detach

# Step 6: Get deployment URL
echo ""
echo "✅ Deployment initiated!"
echo "View status: railway status"
echo "View logs: railway logs"
echo "Open app: railway open"
echo ""
echo "⚠️  Post-deployment: Run database migrations"
echo "   railway run pnpm db:push"
```

### Railway Configuration File

Create `railway.toml` in the project root:

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/api/trpc/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[service]
internalPort = 3000
```

### Permissions Required
- **Railway account** with billing enabled
- **GitHub repository** access (for auto-deploy)
- **No root/sudo** needed — Railway manages the infrastructure

---

## 6. Option B: Render

Render provides predictable fixed-price hosting with automatic deploys from GitHub.

### Pricing
- **Starter Web Service:** $7/month (0.5 vCPU, 512 MB RAM)
- **Standard Web Service:** $25/month (1 vCPU, 2 GB RAM)
- **External MySQL:** Use TiDB Cloud or PlanetScale (see Section 10)

### One-Click Deployment Script

Create a file called `deploy-render.sh`:

```bash
#!/bin/bash
# ============================================================
# LTC Insurance Portal — Render One-Click Deploy
# ============================================================
# Prerequisites:
#   - Render account: https://render.com
#   - render.yaml in project root (created below)
#   - GitHub repo connected to Render
# ============================================================

set -e

echo "🎨 LTC Insurance Portal — Render Deployment"
echo "============================================="

# Step 1: Create render.yaml (Infrastructure as Code)
echo "Step 1: Creating render.yaml..."
cat > render.yaml << 'EOF'
services:
  - type: web
    name: ltc-insurance-portal
    runtime: node
    region: oregon
    plan: starter
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: PDFMONKEY_API_KEY
        sync: false
      - key: VITE_ZAPIER_WEBHOOK_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: VITE_APP_TITLE
        value: LTC Insurance Portal
    healthCheckPath: /
    autoDeploy: true
EOF

echo "Step 2: render.yaml created!"
echo ""
echo "Step 3: Manual steps required:"
echo "  1. Go to https://dashboard.render.com"
echo "  2. Click 'New' → 'Blueprint'"
echo "  3. Connect your GitHub repo: dcradulescu/ltc-insurance-portal"
echo "  4. Render will detect render.yaml and configure everything"
echo "  5. Fill in the secret environment variables when prompted"
echo "  6. Click 'Apply' to deploy"
echo ""
echo "Step 4: After deployment, run migrations:"
echo "  - Go to your service → Shell tab"
echo "  - Run: pnpm db:push"
echo ""
echo "✅ Done! Your app will be at: https://ltc-insurance-portal.onrender.com"
```

### Render Blueprint File

Create `render.yaml` in the project root:

```yaml
services:
  - type: web
    name: ltc-insurance-portal
    runtime: node
    region: oregon
    plan: starter
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: PDFMONKEY_API_KEY
        sync: false
      - key: VITE_ZAPIER_WEBHOOK_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: VITE_APP_TITLE
        value: LTC Insurance Portal
    healthCheckPath: /
    autoDeploy: true
```

---

## 7. Option C: DigitalOcean App Platform

DigitalOcean provides a managed platform with built-in database options.

### Pricing
- **Basic Plan:** $6/month (1 vCPU, 512 MB)
- **Professional Plan:** $12/month (1 vCPU, 1 GB)
- **Managed MySQL:** $15/month (1 GB RAM, 10 GB storage)

### One-Click Deployment Script

Create a file called `deploy-digitalocean.sh`:

```bash
#!/bin/bash
# ============================================================
# LTC Insurance Portal — DigitalOcean App Platform Deploy
# ============================================================
# Prerequisites:
#   - doctl CLI installed: https://docs.digitalocean.com/reference/doctl/
#   - DigitalOcean account with billing
#   - GitHub repo connected
# ============================================================

set -e

echo "🌊 LTC Insurance Portal — DigitalOcean Deployment"
echo "=================================================="

# Step 1: Authenticate
echo "Step 1: Authenticating with DigitalOcean..."
doctl auth init

# Step 2: Create app spec
echo "Step 2: Creating app specification..."
cat > .do/app.yaml << 'EOF'
name: ltc-insurance-portal
region: nyc
services:
  - name: web
    github:
      repo: dcradulescu/ltc-insurance-portal
      branch: main
      deploy_on_push: true
    build_command: pnpm install && pnpm build
    run_command: pnpm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: apps-s-1vcpu-512mb-10gb
    http_port: 3000
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        type: SECRET
      - key: JWT_SECRET
        type: SECRET
      - key: PDFMONKEY_API_KEY
        type: SECRET
      - key: VITE_ZAPIER_WEBHOOK_URL
        type: SECRET
      - key: OPENAI_API_KEY
        type: SECRET
      - key: VITE_APP_TITLE
        value: "LTC Insurance Portal"
databases:
  - name: ltc-db
    engine: MYSQL
    version: "8"
    size: db-s-1vcpu-1gb
    num_nodes: 1
EOF

# Step 3: Create the app
echo "Step 3: Creating application..."
doctl apps create --spec .do/app.yaml

echo ""
echo "✅ App created! Configure secrets in the DigitalOcean dashboard."
echo "   https://cloud.digitalocean.com/apps"
```

---

## 8. Option D: AWS Lightsail (Self-Managed VPS)

For teams comfortable with server administration. Full control, lowest ongoing cost.

### Pricing
- **1 GB RAM Instance:** $5/month
- **2 GB RAM Instance:** $10/month
- **Managed MySQL (RDS):** $15/month minimum
- **Alternative:** Self-hosted MySQL on same VPS: $0 additional

### One-Click Deployment Script

Create a file called `deploy-lightsail.sh`:

```bash
#!/bin/bash
# ============================================================
# LTC Insurance Portal — AWS Lightsail Full Setup
# ============================================================
# Prerequisites:
#   - AWS CLI configured: aws configure
#   - SSH key pair created in Lightsail console
# ============================================================

set -e

echo "☁️  LTC Insurance Portal — AWS Lightsail Deployment"
echo "==================================================="

INSTANCE_NAME="ltc-portal"
REGION="us-east-1"
BLUEPRINT="ubuntu_24_04"
BUNDLE="small_3_0"  # 2 GB RAM, 1 vCPU, $10/mo

# Step 1: Create Lightsail instance
echo "Step 1: Creating Lightsail instance..."
aws lightsail create-instances \
  --instance-names $INSTANCE_NAME \
  --availability-zone ${REGION}a \
  --blueprint-id $BLUEPRINT \
  --bundle-id $BUNDLE \
  --user-data "$(cat <<'USERDATA'
#!/bin/bash
# Auto-setup script runs on first boot

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Install MySQL 8
apt-get install -y mysql-server
systemctl enable mysql
systemctl start mysql

# Secure MySQL
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'CHANGE_THIS_PASSWORD';"
mysql -e "CREATE DATABASE ltc_portal;"
mysql -e "CREATE USER 'ltc_app'@'localhost' IDENTIFIED BY 'CHANGE_APP_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON ltc_portal.* TO 'ltc_app'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Install Nginx (reverse proxy)
apt-get install -y nginx certbot python3-certbot-nginx

# Install PM2 (process manager)
npm install -g pm2

# Create app directory
mkdir -p /var/www/ltc-portal
chown -R ubuntu:ubuntu /var/www/ltc-portal

# Create Nginx config
cat > /etc/nginx/sites-available/ltc-portal << 'NGINX'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/ltc-portal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "Server setup complete!"
USERDATA
)"

echo "Step 2: Waiting for instance to be ready..."
sleep 60

# Step 3: Open ports
echo "Step 3: Configuring firewall..."
aws lightsail open-instance-public-ports \
  --instance-name $INSTANCE_NAME \
  --port-info fromPort=80,toPort=80,protocol=tcp
aws lightsail open-instance-public-ports \
  --instance-name $INSTANCE_NAME \
  --port-info fromPort=443,toPort=443,protocol=tcp

# Step 4: Get public IP
IP=$(aws lightsail get-instance --instance-name $INSTANCE_NAME \
  --query 'instance.publicIpAddress' --output text)

echo ""
echo "✅ Instance created!"
echo "   Public IP: $IP"
echo ""
echo "Next steps (SSH into the server):"
echo "   ssh ubuntu@$IP"
echo ""
echo "Then run the application setup:"
echo "   cd /var/www/ltc-portal"
echo "   git clone https://github.com/dcradulescu/ltc-insurance-portal.git ."
echo "   pnpm install"
echo "   cp .env.example .env  # Edit with your values"
echo "   pnpm build"
echo "   pnpm db:push"
echo "   pm2 start dist/index.js --name ltc-portal"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "For SSL (HTTPS):"
echo "   sudo certbot --nginx -d your-domain.com"
```

### PM2 Ecosystem File

Create `ecosystem.config.cjs` in the project root:

```javascript
module.exports = {
  apps: [{
    name: 'ltc-portal',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

---

## 9. Option E: Hostinger VPS (Budget)

The most affordable option for a self-managed server.

### Pricing
- **KVM 1:** $4.99/month (1 vCPU, 4 GB RAM, 50 GB SSD)
- **KVM 2:** $6.99/month (2 vCPU, 8 GB RAM, 100 GB SSD)

### One-Click Deployment Script

Create a file called `deploy-hostinger.sh`:

```bash
#!/bin/bash
# ============================================================
# LTC Insurance Portal — Hostinger VPS Setup
# ============================================================
# Prerequisites:
#   - Hostinger VPS purchased and SSH access configured
#   - Replace YOUR_VPS_IP with your actual IP
# ============================================================

set -e

VPS_IP="YOUR_VPS_IP"
VPS_USER="root"
DOMAIN="your-domain.com"
DB_PASSWORD=$(openssl rand -hex 16)
APP_DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)

echo "🏠 LTC Insurance Portal — Hostinger VPS Deployment"
echo "==================================================="
echo "VPS IP: $VPS_IP"
echo ""

# Deploy via SSH
ssh $VPS_USER@$VPS_IP << REMOTE_SCRIPT
set -e

echo "=== System Update ==="
apt-get update && apt-get upgrade -y

echo "=== Installing Node.js 22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git nginx certbot python3-certbot-nginx

echo "=== Installing pnpm ==="
npm install -g pnpm@9 pm2

echo "=== Installing MySQL 8 ==="
apt-get install -y mysql-server
systemctl enable mysql && systemctl start mysql

echo "=== Configuring MySQL ==="
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_PASSWORD';"
mysql -e "CREATE DATABASE IF NOT EXISTS ltc_portal;"
mysql -e "CREATE USER IF NOT EXISTS 'ltc_app'@'localhost' IDENTIFIED BY '$APP_DB_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON ltc_portal.* TO 'ltc_app'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "=== Cloning Application ==="
mkdir -p /var/www/ltc-portal
cd /var/www/ltc-portal
git clone https://github.com/dcradulescu/ltc-insurance-portal.git . || git pull

echo "=== Installing Dependencies ==="
pnpm install

echo "=== Creating Environment File ==="
cat > .env << ENV
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://ltc_app:$APP_DB_PASSWORD@localhost:3306/ltc_portal
JWT_SECRET=$JWT_SECRET
PDFMONKEY_API_KEY=YOUR_PDFMONKEY_KEY
VITE_ZAPIER_WEBHOOK_URL=YOUR_ZAPIER_URL
OPENAI_API_KEY=YOUR_OPENAI_KEY
VITE_APP_TITLE=LTC Insurance Portal
ENV

echo "=== Building Application ==="
pnpm build

echo "=== Running Database Migrations ==="
pnpm db:push

echo "=== Importing Database Backup ==="
mysql -u ltc_app -p'$APP_DB_PASSWORD' ltc_portal < ltc-portal-database-2026-08-13.sql 2>/dev/null || true

echo "=== Configuring Nginx ==="
cat > /etc/nginx/sites-available/ltc-portal << 'NGINX'
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/ltc-portal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "=== Starting Application with PM2 ==="
cd /var/www/ltc-portal
pm2 delete ltc-portal 2>/dev/null || true
pm2 start dist/index.js --name ltc-portal
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Deployment complete!"
echo "   App running at: http://$DOMAIN"
echo "   For SSL: certbot --nginx -d $DOMAIN"
REMOTE_SCRIPT

echo ""
echo "=============================================="
echo "✅ Deployment to Hostinger VPS complete!"
echo ""
echo "Database Credentials (SAVE THESE):"
echo "  Root Password: $DB_PASSWORD"
echo "  App Password:  $APP_DB_PASSWORD"
echo "  JWT Secret:    $JWT_SECRET"
echo ""
echo "Next steps:"
echo "  1. SSH into $VPS_IP and edit /var/www/ltc-portal/.env"
echo "  2. Add your PDFMonkey, Zapier, and OpenAI keys"
echo "  3. Run: pm2 restart ltc-portal"
echo "  4. Set up SSL: sudo certbot --nginx -d $DOMAIN"
echo "=============================================="
```

---

## 10. Database Setup

### Option A: TiDB Cloud Serverless (Current — Free Tier)

The application currently uses TiDB Cloud, which offers a generous free tier.

| Feature | Free Tier | Paid |
|---------|-----------|------|
| **Storage** | 5 GB | 25 GB+ |
| **Request Units** | 50M RU/month | Pay-per-use |
| **Cost** | $0 | ~$0.01 per 1M RU |
| **URL** | https://tidbcloud.com | |

**Connection string format:**
```
mysql://user:password@gateway.tidbcloud.com:4000/database?ssl={"rejectUnauthorized":true}
```

### Option B: PlanetScale (Managed MySQL)

| Feature | Scaler | Scaler Pro |
|---------|--------|------------|
| **Storage** | 5 GB | 10 GB |
| **Reads** | 1B row reads | 1.5B |
| **Writes** | 10M row writes | 15M |
| **Cost** | $39/mo | $99/mo |
| **URL** | https://planetscale.com | |

### Option C: Self-Hosted MySQL (On VPS)

If using Lightsail or Hostinger VPS, install MySQL directly:

```bash
# Install MySQL 8
sudo apt-get install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE ltc_portal;"
sudo mysql -e "CREATE USER 'ltc_app'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ltc_portal.* TO 'ltc_app'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Import backup
mysql -u ltc_app -p ltc_portal < ltc-portal-database-2026-08-13.sql
```

**Connection string for self-hosted:**
```
mysql://ltc_app:your_secure_password@localhost:3306/ltc_portal
```

### Option D: DigitalOcean Managed MySQL

| Plan | RAM | Storage | Cost |
|------|-----|---------|------|
| Basic | 1 GB | 10 GB | $15/mo |
| Basic | 2 GB | 25 GB | $30/mo |

---

## 11. Environment Variables Reference

Create a `.env` file with these values:

```bash
# ── Required ──
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-64-character-random-string

# ── PDF Generation ──
PDFMONKEY_API_KEY=your-pdfmonkey-api-key

# ── Email ──
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your-id

# ── AI/LLM (replace Manus Forge with OpenAI) ──
OPENAI_API_KEY=sk-your-openai-key
# Or keep the Forge-compatible format:
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-your-openai-key

# ── File Storage (S3-compatible) ──
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com

# ── Branding ──
VITE_APP_TITLE=LTC Insurance Portal
VITE_APP_LOGO=https://your-cdn.com/logo.png

# ── Authentication (after removing Manus OAuth) ──
# Option 1: Simple JWT auth (built-in)
AUTH_MODE=local
ADMIN_EMAIL=daniel@scvisitingangels.com
ADMIN_PASSWORD=your-secure-admin-password

# Option 2: Auth0
# AUTH0_DOMAIN=your-tenant.auth0.com
# AUTH0_CLIENT_ID=your-client-id
# AUTH0_CLIENT_SECRET=your-client-secret
```

---

## 12. Pre-Deployment Checklist

Run these commands locally before deploying to any host:

```bash
# 1. Clone the repository
git clone https://github.com/dcradulescu/ltc-insurance-portal.git
cd ltc-insurance-portal

# 2. Install dependencies
pnpm install

# 3. Create .env file (copy from Section 11 and fill in values)
cp MIGRATION_ENV_REFERENCE.md .env  # Then edit with real values

# 4. Run TypeScript check
pnpm check

# 5. Run tests
pnpm test

# 6. Build for production
pnpm build

# 7. Verify build output exists
ls dist/index.js

# 8. Test production start locally
NODE_ENV=production node dist/index.js
# Should output: "Server running on http://localhost:3000/"
```

---

## 13. Post-Deployment Verification

After deploying, verify these endpoints work:

```bash
SITE_URL="https://your-deployed-url.com"

# 1. Homepage loads
curl -s -o /dev/null -w "%{http_code}" $SITE_URL
# Expected: 200

# 2. API responds
curl -s -o /dev/null -w "%{http_code}" $SITE_URL/api/trpc/health
# Expected: 200

# 3. Static assets load
curl -s -o /dev/null -w "%{http_code}" $SITE_URL/assets/
# Expected: 200 or 301

# 4. Test full flow
echo "Manual tests:"
echo "  [ ] Login/register works"
echo "  [ ] Policy form saves data"
echo "  [ ] Strategy generates correctly"
echo "  [ ] PDF download works"
echo "  [ ] Email delivery works"
echo "  [ ] Chat responds"
echo "  [ ] All pages load without errors"
echo "  [ ] Mobile responsive layout works"
```

---

## 14. Manus Dependency Removal Guide

Before deploying to a non-Manus host, these changes are required:

### 14.1 Remove Vite Plugin

In `vite.config.ts`, remove the Manus runtime plugin:

```typescript
// REMOVE this line:
import { manusRuntime } from 'vite-plugin-manus-runtime';

// REMOVE from plugins array:
plugins: [
  react(),
  // manusRuntime(),  ← DELETE THIS
]
```

### 14.2 Replace LLM Integration

In `server/_core/llm.ts`, replace the Manus Forge call with OpenAI:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function invokeLLM({ messages, response_format }: any) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    ...(response_format && { response_format }),
  });
  return completion;
}
```

Install the OpenAI package:
```bash
pnpm add openai
```

### 14.3 Replace Storage

The existing `server/storage.ts` already uses `@aws-sdk/client-s3`. Update the configuration to use your own S3 bucket credentials from environment variables.

### 14.4 Replace Authentication

The simplest replacement is local JWT auth. Create a login endpoint that validates email/password against the `users` table and issues a JWT cookie. The existing JWT infrastructure (`jose` package) is already in the project.

### 14.5 Update Media URLs

Replace all Manus CDN URLs in source code with your new storage URLs. The files are in `backup-media/` — upload them to your S3 bucket and update references.

Search and replace pattern:
```
Find:    https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/
Replace: https://your-s3-bucket.s3.amazonaws.com/media/

Find:    /manus-storage/
Replace: https://your-s3-bucket.s3.amazonaws.com/static/
```

---

## 15. Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| `ECONNREFUSED` on database | Wrong DATABASE_URL | Verify host, port, credentials |
| `MODULE_NOT_FOUND` | Missing build step | Run `pnpm build` before `pnpm start` |
| Blank page on frontend | Missing VITE_ env vars | Ensure all `VITE_*` vars are set at build time |
| PDF generation fails | Invalid PDFMONKEY_API_KEY | Verify key at pdfmonkey.io dashboard |
| Email not sending | Zapier webhook inactive | Check Zapier dashboard for errors |
| SSL certificate error | Self-signed or expired | Run `certbot --nginx -d your-domain.com` |
| Port already in use | Another process on 3000 | `lsof -i :3000` then kill the process |
| Memory exceeded | Node.js OOM | Increase instance RAM or add swap |

### Useful Commands

```bash
# Check if app is running
pm2 status

# View application logs
pm2 logs ltc-portal

# Restart application
pm2 restart ltc-portal

# Check database connection
mysql -u ltc_app -p -h localhost ltc_portal -e "SELECT 1;"

# Check disk space
df -h

# Check memory usage
free -m

# Check Node.js version
node --version

# Rebuild from scratch
pnpm install && pnpm build && pm2 restart ltc-portal
```

---

## Quick Reference: Which Option to Choose

| If you want... | Choose |
|----------------|--------|
| Easiest setup, minimal maintenance | **Railway** |
| Predictable monthly bill, no surprises | **Render** |
| Full ecosystem (DB + storage + app) | **DigitalOcean** |
| Maximum control, AWS ecosystem | **AWS Lightsail** |
| Lowest possible cost | **Hostinger VPS** |
| Already have a VPS somewhere | Use the **Lightsail/Hostinger scripts** on your existing server |

---

*End of Document*

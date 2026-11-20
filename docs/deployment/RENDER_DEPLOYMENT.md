# O!Save Monitor — Render Staging Deployment Guide

## Overview

This guide covers deploying O!Save Monitor to Render as a public staging environment using Docker and GitHub integration.

**Target**: Public staging/preview environment accessible via Render URL
**Branch Strategy**: `main` → Render staging, `development` → ongoing development
**Database**: Separate staging database (not production)

---

## Prerequisites

- GitHub repository with O!Save Monitor codebase
- Render account (free tier available)
- Docker installed locally for testing (optional but recommended)
- MySQL/MariaDB database (Render managed PostgreSQL or external MySQL provider)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      RENDER CLOUD                           │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │   Web Service    │         │    Managed Database      │  │
│  │  (Docker)        │────────▶│  (PostgreSQL/MySQL)      │  │
│  │  osave-monitor   │         │  osave-monitor-db        │  │
│  │  - Nginx         │         │                          │  │
│  │  - PHP-FPM       │         │  Staging data only       │  │
│  │  - Queue Worker  │         │                          │  │
│  │  - Scheduler     │         │                          │  │
│  └──────────────────┘         └──────────────────────────┘  │
│         ▲                                                      │
│         │ GitHub Push (main branch)                           │
│         │                                                      │
│  ┌──────────────────┐                                         │
│  │   GitHub Repo    │                                         │
│  │   main branch    │                                         │
│  └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Prepare Repository

### 1.1 Verify Files Exist

Ensure these files are committed to your repository:

```
├── Dockerfile                    # Multi-stage production Dockerfile
├── .dockerignore                 # Excludes dev files from build
├── render.yaml                   # Render Blueprint (infrastructure as code)
├── docker/
│   ├── php/
│   │   ├── production.ini        # PHP production config
│   │   └── opcache.ini           # OPcache optimization
│   ├── nginx/
│   │   ├── nginx.conf            # Nginx main config
│   │   └── site.conf             # Site config with security headers
│   └── supervisor/
│       └── supervisord.conf      # Process manager config
└── docs/deployment/
    ├── RENDER_DEPLOYMENT.md      # This file
    ├── ENVIRONMENT_VARIABLES.md  # Environment variable reference
    └── STAGING_CHECKLIST.md      # Pre-deployment checklist
```

### 1.2 Create Development Branch

```bash
git checkout -b development
git push -u origin development
# Continue development on 'development' branch
```

### 1.3 Verify Main Branch is Clean

```bash
git checkout main
git status  # Should be clean
```

---

## Step 2: Configure Database

### Option A: Render Managed PostgreSQL (Recommended for Render Native)

Render provides managed PostgreSQL. If using this:

1. Update `render.yaml` databases section (already configured)
2. Update web service `DB_CONNECTION=pgsql`
3. Database credentials auto-injected via `fromDatabase`

### Option B: External MySQL/MariaDB (PlanetScale, Railway, Neon, etc.)

If you require MySQL/MariaDB for compatibility:

1. Provision database from provider
2. Note connection details: host, port, database, username, password
3. Add as **Environment Variables** in Render dashboard (not in render.yaml)
4. Set `DB_CONNECTION=mysql` in web service

> **Important**: Never commit database credentials to repository or Docker image.

### Option C: Render Managed MySQL (Not Currently Available)

Render does not offer managed MySQL. Use Option A or B.

---

## Step 3: Connect GitHub to Render

### 3.1 Create New Blueprint

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub account if not connected
4. Select the `cctv-monitoring` repository
5. Render detects `render.yaml` automatically

### 3.2 Review Blueprint

Review the detected services:
- **Web Service**: `osave-monitor-staging` (Docker)
- **Database**: `osave-monitor-db` (PostgreSQL)

Click **Apply** to create resources.

### 3.3 First Deploy

Render will:
1. Build Docker image from `Dockerfile`
2. Provision database
3. Deploy web service
4. Run health checks

**Expected first deploy time**: 5-10 minutes

---

## Step 4: Generate and Set APP_KEY

### 4.1 Generate Key Locally

```bash
# Run locally (requires PHP)
php -r "echo 'base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"

# Or use Laravel artisan if available
php artisan key:generate --show
```

### 4.2 Set in Render Dashboard

1. Go to Web Service → **Environment**
2. Add **Secret** variable:
   - Key: `APP_KEY`
   - Value: `base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (from step 4.1)
3. Save → triggers new deploy

> **Critical**: Do this AFTER first deploy but BEFORE testing login. Without APP_KEY, sessions and encryption fail.

---

## Step 5: Run Migrations (Manual Step)

Render does **not** run migrations automatically on deploy (by design for safety).

### 5.1 Access Render Shell

1. Go to Web Service → **Shell**
2. Run migration command:

```bash
php artisan migrate --force
```

### 5.2 Seed Staging Data (Optional)

```bash
# Only for staging - creates demo users/stores
php artisan db:seed --force
```

### 5.3 Verify Database

```bash
php artisan tinker --execute "echo 'Users: ' . App\Models\User::count() . PHP_EOL; echo 'Stores: ' . App\Models\Store::count() . PHP_EOL;"
```

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain

1. Web Service → **Settings** → **Custom Domains**
2. Add domain: `staging-osave.yourdomain.com`
3. Configure DNS CNAME to Render subdomain

### 6.2 Update APP_URL

Add environment variable:
- `APP_URL=https://staging-osave.yourdomain.com`

---

## Step 7: Verify Deployment

### 7.1 Health Check

```bash
curl https://your-app.onrender.com/health
# Should return: OK
```

### 7.2 Test Login

1. Open `https://your-app.onrender.com/login`
2. Use demo credentials (from seeder):
   - Master Admin: `admin@osave.id` / `Admin123!`
   - GM: `gm@osave.id` / `Gm123!`
   - SV: `sv.kemang@osave.id` / `Sv123!`
   - Staff: `staff@osave.id` / `Staff123!`

### 7.3 Verify Features

- [ ] Login works
- [ ] Monitoring map loads
- [ ] Store markers display
- [ ] Admin panel accessible (Master Admin only)
- [ ] Camera management accessible
- [ ] User management accessible
- [ ] Alerts page accessible
- [ ] Activity logs accessible

---

## Step 8: Configure Auto-Deploy

### 8.1 Enable Auto-Deploy (Default)

In `render.yaml`: `autoDeploy: true`

Every push to `main` triggers new deploy.

### 8.2 Disable Auto-Deploy (Manual Control)

In Render Dashboard:
- Web Service → **Settings** → **Build & Deploy**
- Toggle **Auto-Deploy** off
- Manual deploys via **Manual Deploy** button

---

## Deployment Workflow

### Daily Development

```bash
# 1. Work on development branch
git checkout development
# ... make changes, commit ...

# 2. Test locally
./vendor/bin/pint
php artisan test

# 3. When ready for staging
git checkout main
git merge development
git push origin main
# → Render auto-deploys (if enabled)
```

### Manual Deploy (if auto-deploy disabled)

```bash
# Push to main
git push origin main

# Then in Render Dashboard:
# Web Service → Manual Deploy → Deploy latest commit
```

### Rollback

```bash
# Option 1: Render Dashboard
# Web Service → Manual Deploy → Select previous commit → Deploy

# Option 2: Git revert
git revert <commit-hash>
git push origin main
```

---

## Environment-Specific Configuration

### Staging vs Production Differences

| Setting | Staging | Production |
|---------|---------|------------|
| `APP_DEBUG` | `false` | `false` |
| `APP_ENV` | `production` | `production` |
| `LOG_LEVEL` | `error` | `error` |
| Database | Staging DB | Production DB |
| `APP_URL` | `https://staging-...` | `https://app.osave.id` |
| Map Provider | OSM (free) | MapTiler/Mapbox (paid) |
| Queue Workers | 1 | 2+ |
| Plan | Starter | Standard/Pro |

### Staging Data Policy

- **Demo data only** — clearly labeled `(DEMO)` in names/notes
- **No real camera credentials** — RTSP URLs, passwords never stored
- **No real store coordinates** — Jakarta/Bandung/Surabaya demo locations
- **Demo users** — predictable emails/passwords for testing

---

## Monitoring & Logs

### Render Logs

- Web Service → **Logs** — Combined stdout/stderr
- Filter by process: nginx, php-fpm, queue-worker, scheduler

### Laravel Logs

```bash
# In Render Shell
tail -f storage/logs/laravel.log
```

### Health Monitoring

- Render provides basic uptime monitoring
- Add external monitoring (UptimeRobot, Pingdom) for staging URL
- Health endpoint: `GET /health` returns `200 OK`

---

## Troubleshooting

### Build Failures

| Error | Solution |
|-------|----------|
| `npm ci` fails | Check `package.json` lockfile matches; run `npm install` locally |
| `composer install` fails | Check PHP version compatibility; verify `composer.lock` |
| PHP extension missing | Add to `Dockerfile` `docker-php-ext-install` |

### Runtime Errors

| Error | Solution |
|-------|----------|
| `APP_KEY` not set | Generate and add as secret env var |
| Database connection failed | Verify DB env vars; check database allows Render IPs |
| 500 on login | Check `storage/logs/laravel.log`; verify session/config cache |
| Assets 404 | Ensure `npm run build` ran; check `public/build/manifest.json` exists |
| Queue not processing | Check `queue-worker` logs in Render; verify `QUEUE_CONNECTION=database` |

### Performance Issues

- Enable OPcache (already in `opcache.ini`)
- Use `database` cache/session/queue for starter plan
- Upgrade plan for more CPU/RAM
- Add Redis for cache/queue if needed

---

## Security Checklist (Pre-Deploy)

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] `APP_KEY` set as secret (not in repo)
- [ ] Database credentials as env vars (not in repo)
- [ ] No `.env` in repository
- [ ] No camera credentials in frontend
- [ ] No RTSP URLs in source code
- [ ] HTTPS enforced (Render provides automatically)
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting on auth endpoints (implement in middleware if needed)
- [ ] Demo data only in staging database

---

## Cost Estimation (Render Starter Plan)

| Resource | Plan | Est. Monthly |
|----------|------|--------------|
| Web Service | Starter | $7/month |
| PostgreSQL | Starter | $7/month |
| **Total** | | **~$14/month** |

> Free tier available for low-traffic testing (spins down after inactivity)

---

## Next Steps After Staging Success

1. **Validate with stakeholders** — Demo monitoring map, admin panel
2. **Load test** — Simulate concurrent users
3. **Security audit** — Penetration test staging
4. **Plan production** — Separate Render blueprint, production database, custom domain, monitoring
5. **CI/CD pipeline** — Add GitHub Actions for automated testing before merge to main

---

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Docker Guide](https://render.com/docs/docker)
- [Laravel on Render](https://render.com/docs/deploy-laravel)
- [Laravel Deployment Docs](https://laravel.com/docs/deployment)

---

*Last updated: November 2026*
*For O!Save Monitor Epic 5 completion — Staging deployment preparation*
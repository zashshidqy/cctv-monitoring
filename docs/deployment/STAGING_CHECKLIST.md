# O!Save Monitor — Staging Deployment Checklist

Use this checklist before and after deploying to Render staging.

---

## Pre-Deployment Checklist

### Repository & Code

- [ ] All changes committed to `development` branch
- [ ] Tests passing locally (`php artisan test`)
- [ ] Code style fixed (`./vendor/bin/pint --format agent`)
- [ ] No debug/test code in production paths
- [ ] No hardcoded credentials, URLs, or IPs
- [ ] `.env` not committed (verify `.gitignore`)
- [ ] `main` branch clean and up to date

### Docker Configuration

- [ ] `Dockerfile` exists and uses multi-stage build
- [ ] `.dockerignore` excludes dev files, logs, cache
- [ ] PHP extensions: `pdo_mysql`, `mbstring`, `gd`, `zip`, `intl`, `opcache`, `redis`, `bcmath`, `pcntl`, `exif`
- [ ] Production PHP config (`docker/php/production.ini`)
- [ ] OPcache config (`docker/php/opcache.ini`)
- [ ] Nginx config with security headers (`docker/nginx/`)
- [ ] Supervisor config for all processes (`docker/supervisor/`)
- [ ] Health check endpoint (`/health`)
- [ ] Non-root user (`appuser`) configured

### Render Configuration

- [ ] `render.yaml` exists and valid YAML
- [ ] Web service type: `docker`
- [ ] Database service defined (PostgreSQL or external MySQL)
- [ ] Region selected (close to users: Singapore for SEA)
- [ ] Plan selected (Starter for staging)
- [ ] `autoDeploy: true` for main branch
- [ ] Health check path: `/health`
- [ ] Environment variables defined (non-secrets only)

### Database Strategy

- [ ] Staging database separate from production
- [ ] Database provider selected (Render PostgreSQL / PlanetScale / Railway / etc.)
- [ ] Migration compatibility verified (MySQL → PostgreSQL if switching)
- [ ] No `migrate:fresh` or `db:wipe` in deployment
- [ ] Seed data is **demo only** — clearly labeled
- [ ] No real camera credentials in staging database

### Security

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] `APP_KEY` will be set as secret (not in repo)
- [ ] Database credentials as secrets
- [ ] No API keys in source code
- [ ] No camera RTSP URLs/credentials in frontend
- [ ] No internal IPs exposed
- [ ] CSP headers configured in Nginx
- [ ] HTTPS enforced (Render provides automatically)
- [ ] Session secure cookie enabled
- [ ] Session encryption enabled

### Documentation

- [ ] `RENDER_DEPLOYMENT.md` complete
- [ ] `ENVIRONMENT_VARIABLES.md` complete
- [ ] `STAGING_CHECKLIST.md` (this file) complete

---

## Deployment Process Checklist

### First-Time Setup

- [ ] Connect GitHub repo to Render Blueprint
- [ ] Review and apply Blueprint (creates web service + database)
- [ ] Wait for first build + deploy (5-10 min)
- [ ] Generate `APP_KEY` locally
- [ ] Add `APP_KEY` as **Secret** in Render Dashboard
- [ ] Verify deploy triggers after adding `APP_KEY`

### Database Migration

- [ ] Access Render Shell (Web Service → Shell)
- [ ] Run `php artisan migrate --force`
- [ ] Verify tables created: `php artisan migrate:status`
- [ ] (Optional) Run seeder: `php artisan db:seed --force`
- [ ] Verify demo data: `php artisan tinker --execute "echo 'Users: ' . App\Models\User::count();"`

### Post-Deploy Verification

#### Health & Basics

- [ ] Health endpoint: `curl https://<app>.onrender.com/health` → `OK`
- [ ] Homepage redirects to login: `https://<app>.onrender.com/`
- [ ] Login page loads: `https://<app>.onrender.com/login`
- [ ] No console errors in browser dev tools

#### Authentication

- [ ] Master Admin login: `admin@osave.id` / `Admin123!`
- [ ] GM login: `gm@osave.id` / `Gm123!`
- [ ] SV login: `sv.kemang@osave.id` / `Sv123!`
- [ ] Staff login: `staff@osave.id` / `Staff123!`
- [ ] Invalid credentials rejected gracefully
- [ ] Inactive/locked users rejected
- [ ] Logout works

#### Monitoring Map

- [ ] Map loads (OSM tiles visible)
- [ ] Store markers display (4 demo stores)
- [ ] Marker colors reflect status (green/partial/red)
- [ ] Store popup opens on click
- [ ] Camera explorer opens from popup
- [ ] Map controls work (zoom, pan, pitch)

#### Admin Panel (Master Admin only)

- [ ] `/admin` accessible after Master Admin login
- [ ] Store management: list, create, edit, deactivate
- [ ] Camera management: list, create, edit, deactivate
- [ ] User management: list, create, edit, permissions
- [ ] Roles & Permissions: view, update role permissions
- [ ] Activity logs: view audit trail
- [ ] GM/SV/Staff **cannot** access `/admin`

#### Camera Features

- [ ] Camera list shows demo cameras (if seeded)
- [ ] Camera test connection works (mock/test)
- [ ] Playback session creation works (mock)
- [ ] Alerts page loads
- [ ] Activity logs load

#### RBAC Verification

- [ ] Master Admin: all permissions
- [ ] GM: global monitoring view, no admin
- [ ] SV: assigned store only (Kemang Raya)
- [ ] Staff: no operational permissions by default
- [ ] Unauthorized access returns 403/restricted page

#### Performance

- [ ] Page load < 3s (first load)
- [ ] Map tiles load smoothly
- [ ] No memory leaks in browser dev tools
- [ ] Queue worker processing jobs (check logs)

#### Logs & Monitoring

- [ ] Render logs show no errors (Web Service → Logs)
- [ ] Laravel logs: `storage/logs/laravel.log` clean
- [ ] Supervisor processes all running: `ps aux` in shell
- [ ] Health check passing in Render dashboard

---

## Post-Deployment Checklist

### Stakeholder Demo

- [ ] Share staging URL with stakeholders
- [ ] Demo: Login → Map → Store → Camera
- [ ] Demo: Admin panel (Master Admin)
- [ ] Collect feedback

### Documentation Updates

- [ ] Record actual Render URL in team docs
- [ ] Document demo credentials (share securely)
- [ ] Note any configuration differences from local

### Cleanup

- [ ] Remove any temporary test data
- [ ] Verify no production data in staging
- [ ] Confirm staging database is isolated

---

## Rollback Checklist

If deployment has critical issues:

- [ ] Identify last working commit
- [ ] In Render Dashboard: Web Service → Manual Deploy → Select previous commit → Deploy
- [ ] OR: `git revert <bad-commit>` → `git push origin main`
- [ ] Verify rollback restores functionality
- [ ] Document issue for root cause analysis

---

## Ongoing Maintenance

### Weekly

- [ ] Check Render logs for errors
- [ ] Verify health checks passing
- [ ] Monitor disk usage (Render dashboard)

### Per Sprint / Epic

- [ ] Update staging after `main` merge
- [ ] Run migrations if schema changed
- [ ] Update demo data if needed
- [ ] Verify new features on staging

### Monthly

- [ ] Rotate `APP_KEY` (coordinate with team)
- [ ] Review database size/performance
- [ ] Update dependencies (composer/npm)
- [ ] Security scan

---

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Dev Lead | [Name/Slack] | Deployment decisions |
| DBA | [Name/Slack] | Database issues |
| Security | [Name/Slack] | Security incidents |
| Render Support | [Dashboard] | Infrastructure issues |

---

## Sign-Off

| Check | Verified By | Date |
|-------|-------------|------|
| Pre-deployment complete | | |
| Deployment successful | | |
| Post-deploy verification complete | | |
| Stakeholder demo done | | |
| **READY FOR STAGING USE** | | |

---

*Last updated: November 2026*
*Part of O!Save Monitor Render Staging Deployment*
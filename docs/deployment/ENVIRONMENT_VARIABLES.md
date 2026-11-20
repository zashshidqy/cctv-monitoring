# O!Save Monitor — Environment Variables Reference

## Overview

This document lists all environment variables required for O!Save Monitor deployment. Variables are categorized by purpose and sensitivity.

**Never commit actual values to repository.** Use Render Dashboard (Environment tab) or `.env` locally.

---

## Required Variables (Must Set)

### Application Core

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application display name | `O!Save Monitor` | Yes |
| `APP_ENV` | Environment: `local`, `production` | `production` | Yes |
| `APP_KEY` | **Secret** - 32-char base64 encryption key | `base64:xxxx...` | **Yes (Secret)** |
| `APP_DEBUG` | Debug mode (never `true` in production) | `false` | Yes |
| `APP_URL` | Full public URL (no trailing slash) | `https://staging-osave.onrender.com` | Yes |
| `APP_LOCALE` | Default locale | `en` | No (default: en) |
| `APP_FALLBACK_LOCALE` | Fallback locale | `en` | No |
| `APP_FAKER_LOCALE` | Faker locale for seeding | `en_US` | No |
| `APP_MAINTENANCE_DRIVER` | Maintenance mode driver | `file` | No |
| `APP_MAINTENANCE_STORE` | Maintenance mode store | `database` | No |

### Database

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DB_CONNECTION` | Database driver: `mysql`, `pgsql`, `sqlite` | `pgsql` | Yes |
| `DB_HOST` | Database host | `dpg-xxxx.render.com` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `DB_DATABASE` | Database name | `osave_monitor` | Yes |
| `DB_USERNAME` | Database user | `osave_monitor` | Yes |
| `DB_PASSWORD` | **Secret** - Database password | `xxxx...` | **Yes (Secret)** |
| `DB_CHARSET` | Character set | `utf8mb4` | No |
| `DB_COLLATION` | Collation | `utf8mb4_unicode_ci` | No |
| `DB_FOREIGN_KEYS` | Enforce foreign keys | `true` | No |
| `MYSQL_ATTR_SSL_CA` | MySQL SSL CA path (if required) | `/path/to/ca.pem` | No |

### Session & Cache

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SESSION_DRIVER` | Session driver: `database`, `redis`, `file` | `database` | Yes |
| `SESSION_LIFETIME` | Session lifetime in minutes | `120` | No |
| `SESSION_ENCRYPT` | Encrypt session cookie | `true` | Yes (prod) |
| `SESSION_SECURE_COOKIE` | Secure cookie flag (HTTPS) | `true` | Yes (prod) |
| `SESSION_PATH` | Cookie path | `/` | No |
| `SESSION_DOMAIN` | Cookie domain | `null` | No |
| `CACHE_STORE` | Cache driver: `database`, `redis`, `file` | `database` | Yes |
| `CACHE_PREFIX` | Cache key prefix | `osave-cache-` | No |

### Queue

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `QUEUE_CONNECTION` | Queue driver: `database`, `redis`, `sync` | `database` | Yes |
| `DB_QUEUE_CONNECTION` | Queue DB connection | `mysql` | No |
| `DB_QUEUE_TABLE` | Queue table name | `jobs` | No |
| `DB_QUEUE_RETRY_AFTER` | Job retry timeout (seconds) | `90` | No |

### Filesystem

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FILESYSTEM_DISK` | Default disk: `local`, `s3` | `local` | Yes |

### Mail

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MAIL_MAILER` | Mailer: `log`, `smtp`, `ses`, `postmark` | `log` | Yes (staging) |
| `MAIL_HOST` | SMTP host | `smtp.example.com` | If SMTP |
| `MAIL_PORT` | SMTP port | `587` | If SMTP |
| `MAIL_USERNAME` | SMTP username | `user@example.com` | If SMTP |
| `MAIL_PASSWORD` | **Secret** - SMTP password | `xxxx` | **If SMTP (Secret)** |
| `MAIL_ENCRYPTION` | `tls`, `ssl`, `null` | `tls` | If SMTP |
| `MAIL_FROM_ADDRESS` | Default from address | `noreply@osave.id` | Yes |
| `MAIL_FROM_NAME` | Default from name | `O!Save Monitor` | Yes |

### Logging

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `LOG_CHANNEL` | Log channel: `stack`, `single`, `daily` | `stack` | Yes |
| `LOG_STACK` | Channels in stack | `single` | No |
| `LOG_LEVEL` | Minimum log level: `debug`, `info`, `error` | `error` | Yes (prod) |
| `LOG_DEPRECATIONS_CHANNEL` | Deprecation log channel | `null` | No |

---

## Optional Variables (Feature-Specific)

### Map Configuration

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `MAP_PROVIDER` | Tile provider: `osm`, `maptiler`, `mapbox`, `custom` | `osm` | `osm` |
| `MAP_API_KEY` | **Secret** - Provider API key | `xxxx` | `` |
| `MAP_STYLE_URL` | Style URL or tile pattern | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | OSM |
| `MAP_ATTRIBUTION` | Attribution text | `© OpenStreetMap contributors` | OSM |
| `MAP_DEFAULT_LNG` | Default map center longitude | `106.8456` | `106.8456` |
| `MAP_DEFAULT_LAT` | Default map center latitude | `-6.2088` | `-6.2088` |
| `MAP_DEFAULT_ZOOM` | Default zoom level | `11` | `11` |

### Redis (Optional - for cache/queue/broadcasting)

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `REDIS_CLIENT` | Client: `phpredis`, `predis` | `phpredis` | `phpredis` |
| `REDIS_HOST` | Redis host | `127.0.0.1` | `127.0.0.1` |
| `REDIS_PASSWORD` | **Secret** - Redis password | `xxxx` | `null` |
| `REDIS_PORT` | Redis port | `6379` | `6379` |
| `REDIS_DB` | Database number | `0` | `0` |

### Broadcasting (Optional - for realtime)

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `BROADCAST_CONNECTION` | Driver: `log`, `pusher`, `ably`, `reverb` | `log` | `log` |
| `PUSHER_APP_ID` | Pusher app ID | `xxxx` | |
| `PUSHER_APP_KEY` | **Secret** - Pusher key | `xxxx` | **Secret** |
| `PUSHER_APP_SECRET` | **Secret** - Pusher secret | `xxxx` | **Secret** |
| `PUSHER_HOST` | Pusher host | `api.pusher.com` | |
| `PUSHER_PORT` | Pusher port | `443` | |
| `PUSHER_SCHEME` | `http`, `https` | `https` | |

### AWS/S3 (Optional - for file storage)

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `AWS_ACCESS_KEY_ID` | **Secret** - AWS access key | `xxxx` | **Secret** |
| `AWS_SECRET_ACCESS_KEY` | **Secret** - AWS secret key | `xxxx` | **Secret** |
| `AWS_DEFAULT_REGION` | AWS region | `us-east-1` | `us-east-1` |
| `AWS_BUCKET` | S3 bucket name | `osave-staging` | |
| `AWS_URL` | Custom S3 URL | `https://bucket.s3.region.amazonaws.com` | |
| `AWS_ENDPOINT` | Custom endpoint (MinIO, etc.) | `https://s3.example.com` | |
| `AWS_USE_PATH_STYLE_ENDPOINT` | Use path-style URLs | `false` | `false` |

### Monitoring & Health (Optional)

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `HEALTH_CHECK_INTERVAL` | Health check interval (seconds) | `30` | `30` |
| `CAMERA_PROBE_INTERVAL` | Camera probe interval (seconds) | `60` | `60` |
| `ALERT_THRESHOLD_FAILURES` | Consecutive failures before alert | `3` | `3` |
| `PLAYBACK_SESSION_TTL` | Playback session TTL (minutes) | `30` | `30` |

### Security (Optional - Advanced)

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `BCRYPT_ROUNDS` | Password hash rounds | `12` | `12` |
| `APP_PREVIOUS_KEYS` | Previous APP_KEYs for rotation | `base64:oldkey1,base64:oldkey2` | |
| `TRUSTED_PROXIES` | Trusted proxy IPs | `*`, `10.0.0.0/8` | `*` |

---

## Environment-Specific Values

### Local Development (`.env`)

```bash
APP_NAME=O!Save Monitor
APP_ENV=local
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=log

MAP_PROVIDER=osm
```

### Render Staging (Dashboard Environment Variables)

```bash
APP_NAME=O!Save Monitor
APP_ENV=production
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # SECRET
APP_DEBUG=false
APP_URL=https://staging-osave.onrender.com      # Auto-populated by Render

DB_CONNECTION=pgsql
DB_HOST=                                        # From database service
DB_PORT=                                        # From database service
DB_DATABASE=                                    # From database service
DB_USERNAME=                                    # From database service
DB_PASSWORD=                                    # SECRET - From database service

SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

MAIL_MAILER=log

MAP_PROVIDER=osm
MAP_STYLE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

LOG_CHANNEL=stack
LOG_LEVEL=error
```

### Production (Reference Only)

```bash
APP_NAME=O!Save Monitor
APP_ENV=production
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # SECRET - DIFFERENT FROM STAGING
APP_DEBUG=false
APP_URL=https://monitor.osave.id

DB_CONNECTION=mysql
DB_HOST=                                          # Production DB host
DB_PORT=3306
DB_DATABASE=osave_monitor_prod
DB_USERNAME=osave_prod
DB_PASSWORD=                                      # SECRET

SESSION_DRIVER=redis
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
CACHE_STORE=redis
QUEUE_CONNECTION=redis
FILESYSTEM_DISK=s3

MAIL_MAILER=postmark
MAIL_FROM_ADDRESS=noreply@osave.id
MAIL_FROM_NAME=O!Save Monitor

MAP_PROVIDER=maptiler
MAP_API_KEY=                                      # SECRET
MAP_STYLE_URL=https://api.maptiler.com/maps/.../style.json

LOG_CHANNEL=stack
LOG_LEVEL=error

REDIS_HOST=                                       # Production Redis
REDIS_PASSWORD=                                   # SECRET

BROADCAST_CONNECTION=reverb
# Reverb/Pusher credentials...
```

---

## Setting Variables in Render

### Via Dashboard (Recommended for Secrets)

1. Go to **Web Service** → **Environment**
2. Click **Add Environment Variable**
3. For secrets (keys, passwords): Toggle **Secret** ON
4. Save → Triggers deploy

### Via render.yaml (Non-Secrets Only)

```yaml
envVars:
  - key: APP_NAME
    value: O!Save Monitor
  - key: APP_ENV
    value: production
  # Secrets should NOT be in render.yaml
  # Use dashboard for: APP_KEY, DB_PASSWORD, MAP_API_KEY, etc.
```

### Via Database Service (Auto-Injected)

```yaml
envVars:
  - key: DB_HOST
    fromDatabase:
      name: osave-monitor-db
      property: host
  - key: DB_PASSWORD
    fromDatabase:
      name: osave-monitor-db
      property: password
    # Automatically marked as secret
```

---

## Generating APP_KEY

```bash
# Option 1: Laravel Artisan (local)
php artisan key:generate --show

# Option 2: PHP one-liner
php -r "echo 'base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"

# Option 3: OpenSSL
openssl rand -base64 32 | sed 's/^/base64:/'
```

Output format: `base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Security Notes

1. **Never** put secrets in:
   - `.env` file committed to git
   - `render.yaml` (public in repo)
   - Docker image (build args, ENV)
   - Frontend code (Vite injects `VITE_*` vars to bundle)

2. **Always** use Render Dashboard **Secret** toggle for:
   - `APP_KEY`
   - `DB_PASSWORD`
   - `MAP_API_KEY`
   - `MAIL_PASSWORD`
   - `AWS_SECRET_ACCESS_KEY`
   - `PUSHER_APP_SECRET`
   - Any API keys, tokens, passwords

3. **Rotate** secrets periodically:
   - `APP_KEY` rotation requires re-encrypting all encrypted data
   - Database passwords via provider dashboard
   - API keys via provider dashboard

4. **Staging vs Production**: Use **completely different** secrets

---

## Validation Checklist

Before deploying, verify:

- [ ] All **Required** variables set
- [ ] All **Secrets** marked as secret in Render Dashboard
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] `APP_URL` matches actual Render URL (or custom domain)
- [ ] `SESSION_SECURE_COOKIE=true` (HTTPS)
- [ ] `SESSION_ENCRYPT=true`
- [ ] Database credentials correct and database accessible
- [ ] `MAIL_MAILER=log` for staging (no real emails sent)
- [ ] Map provider configured (OSM free for staging)
- [ ] No local-only values (localhost, 127.0.0.1) in production vars

---

*Last updated: November 2026*
*Part of O!Save Monitor Render Staging Deployment*
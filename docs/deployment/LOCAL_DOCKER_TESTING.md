# O!Save Monitor — Local Docker Testing Guide

## Docker Availability Status

**Docker daemon not running on current development machine.**

This document provides alternative verification methods and instructions for when Docker becomes available.

---

## Alternative Verification Methods (No Docker)

### 1. Laravel Local Development Server

```bash
# Start all services
composer run dev

# Or individually:
php artisan serve --host=0.0.0.0 --port=8000
npm run dev
php artisan queue:work
php artisan schedule:work
```

### 2. Verify Production Build Locally

```bash
# Install production dependencies
composer install --no-dev --optimize-autoloader

# Build frontend for production
npm run build

# Verify build output
ls -la public/build/
# Should contain: manifest.json, assets/*.js, assets/*.css

# Test with Laravel Octane (optional - requires Swoole/RoadRunner)
# php artisan octane:start --server=swoole --port=8000
```

### 3. Configuration Validation

```bash
# Clear all caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Cache for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Verify no errors
php artisan config:show app
php artisan config:show database
php artisan config:show session
```

### 4. Run Test Suite

```bash
# Full test suite
php artisan test

# With coverage (if xdebug/pcov installed)
php artisan test --coverage
```

### 5. Static Analysis

```bash
# PHPStan (if installed)
./vendor/bin/phpstan analyse

# Psalm (if installed)
./vendor/bin/psalm

# Pint code style
./vendor/bin/pint --format agent
```

### 6. Security Audit

```bash
# Composer audit
composer audit

# npm audit
npm audit
```

---

## When Docker Is Available

### Build Image

```bash
cd /path/to/cctv-monitoring
docker build -t osave-monitor-staging .
```

### Run Container Locally

```bash
# Create .env file for testing
cp .env.example .env.docker
# Edit .env.docker with test values:
# APP_ENV=production
# APP_DEBUG=false
# DB_CONNECTION=sqlite
# DB_DATABASE=/var/www/html/database/database.sqlite

# Run container
docker run -d \
  --name osave-test \
  -p 8080:8080 \
  -v $(pwd)/.env.docker:/var/www/html/.env \
  -v $(pwd)/database:/var/www/html/database \
  osave-monitor-staging
```

### Verify Container

```bash
# Health check
curl http://localhost:8080/health
# Should return: OK

# Test login page
curl -I http://localhost:8080/login
# Should return: 200 OK

# Check logs
docker logs osave-test

# Access shell
docker exec -it osave-test /bin/sh
```

### Test with SQLite (Simplest)

```bash
# In container shell:
php artisan migrate --force --database=sqlite --path=database/migrations
php artisan db:seed --force
```

### Test with MySQL/PostgreSQL

```bash
# Start database container
docker run -d --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=osave_test \
  -e MYSQL_USER=osave \
  -e MYSQL_PASSWORD=secret \
  -p 3306:3306 \
  mysql:8.0

# Update .env.docker with MySQL credentials
# Run migrations in app container
docker exec osave-test php artisan migrate --force
```

### Cleanup

```bash
docker stop osave-test mysql-test
docker rm osave-test mysql-test
docker rmi osave-monitor-staging
```

---

## Render Deployment Without Local Docker

You can deploy to Render **without local Docker testing** by:

1. **Push to GitHub** - Render builds Docker image in their infrastructure
2. **Monitor Render Build Logs** - Check for build errors in Render dashboard
3. **Test on Render Staging** - Deploy to staging, test there
4. **Iterate** - Fix issues, push again

### Render Build Advantages

- Clean build environment every deploy
- Same base image as production
- No local Docker dependency
- Build logs visible in dashboard

### Pre-Deploy Checklist (No Docker)

- [ ] All tests pass locally (`php artisan test`)
- [ ] Code style correct (`./vendor/bin/pint --format agent`)
- [ ] Production build works (`npm run build`)
- [ ] No dev dependencies in production composer (`composer install --no-dev`)
- [ ] Config caches without errors (`php artisan config:cache`)
- [ ] All required env vars documented
- [ ] Health check route exists (`/health`)
- [ ] Security headers configured in Nginx
- [ ] `.dockerignore` excludes dev files

---

## CI/CD Alternative: GitHub Actions

If you want automated Docker testing without local Docker:

```yaml
# .github/workflows/docker-test.yml
name: Docker Test

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]

jobs:
  docker-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t osave-monitor-test .
      
      - name: Run container
        run: |
          docker run -d --name test-app -p 8080:8080 osave-monitor-test
          sleep 10
      
      - name: Health check
        run: |
          curl -f http://localhost:8080/health || exit 1
      
      - name: Test login page
        run: |
          curl -f http://localhost:8080/login || exit 1
      
      - name: Cleanup
        if: always()
        run: docker stop test-app && docker rm test-app
```

This runs on every push/PR, ensuring Docker build works before Render deploy.

---

## Summary

| Method | Pros | Cons |
|--------|------|------|
| Local Docker | Full production parity | Requires Docker daemon |
| Laravel Dev Server | Fast iteration | Not production-like |
| Production Build + Octane | Close to prod | Requires Swoole/RoadRunner |
| Render Direct Deploy | No local setup needed | Slower feedback loop |
| GitHub Actions | Automated, clean env | Requires CI setup |

**Recommendation**: Use Laravel dev server for daily development. Push to `main` for Render staging deploy. Add GitHub Actions for automated Docker testing when CI is set up.

---

*Last updated: November 2026*
*Part of O!Save Monitor Render Staging Deployment*
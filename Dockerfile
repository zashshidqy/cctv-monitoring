# Multi-stage Dockerfile for O!Save Monitor - Render Deployment
# Stage 1: Frontend Builder (Node.js)
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY resources/css/ ./resources/css/
COPY resources/js/ ./resources/js/

# Install dependencies and build frontend assets
RUN npm ci --ignore-scripts && npm run build

# Stage 2: Composer Dependencies (PHP)
FROM composer:2.8 AS composer-builder

WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies (production only)
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader --no-scripts

# Stage 3: Production Runtime (PHP-FPM + Nginx)
FROM php:8.3-fpm-alpine AS production

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    icu-dev \
    linux-headers \
    $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers

# Configure PHP for production
COPY docker/php/production.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/10-opcache.ini

# Configure Nginx
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/site.conf /etc/nginx/http.d/default.conf

# Configure Supervisor
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create application user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Set working directory
WORKDIR /var/www/html

# Copy application files from composer builder
COPY --from=composer-builder /app/vendor ./vendor
COPY --from=composer-builder /app/composer.json ./composer.json

# Copy application source code
COPY app/ ./app/
COPY bootstrap/ ./bootstrap/
COPY config/ ./config/
COPY database/ ./database/
COPY public/ ./public/
COPY routes/ ./routes/
COPY resources/views/ ./resources/views/
COPY storage/ ./storage/
COPY artisan ./

# Copy built frontend assets
COPY --from=frontend-builder /app/public/build ./public/build
COPY --from=frontend-builder /app/public/hot ./public/hot

# Set permissions
RUN chown -R appuser:appgroup /var/www/html \
    && chown -R appuser:appgroup /var/www/html/storage \
    && chown -R appuser:appgroup /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Create nginx cache and log directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/log/supervisor \
    && chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/log/supervisor

# Create health check endpoint
RUN echo '<?php echo "OK";' > /var/www/html/public/health

# Switch to non-root user
USER appuser

# Expose port (Render uses PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start supervisor (manages nginx + php-fpm + queue worker + scheduler)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
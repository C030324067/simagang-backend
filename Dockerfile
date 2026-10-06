FROM php:8.2-cli

# Set variabel agar Composer aman dijalankan sebagai root
ENV COMPOSER_ALLOW_SUPERUSER=1

# Install dependensi sistem, paket pengembangan, & Node.js 20
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libpq-dev libzip-dev libicu-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install semua ekstensi PHP yang dibutuhkan Laravel
RUN docker-php-ext-install pdo pdo_pgsql mbstring bcmath gd zip intl

# Copy Composer resmi
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set folder kerja
WORKDIR /var/www/html

# Copy semua file proyek
COPY . .

# Hapus file .env lokal & cache dari laptop agar variabel lingkungan Docker/VPS tidak tertimpa
RUN rm -f .env bootstrap/cache/*.php

# Install dependensi PHP (Laravel)
RUN composer install --no-dev --optimize-autoloader --no-scripts --ignore-platform-reqs

# Re-generate manifest paket tanpa membawa paket dev
RUN php artisan package:discover --ansi

# Install dependensi NPM & build aset React/Inertia
RUN npm install && npm run build

# Beri izin akses folder storage & cache Laravel
RUN chmod -R 775 storage bootstrap/cache

# Jalankan pembersihan cache & server Laravel
CMD ["sh", "-c", "php artisan config:clear && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
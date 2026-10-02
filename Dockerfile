FROM php:8.2-cli

# Install dependensi sistem & Node.js 20
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libpq-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ekstensi PHP yang dibutuhkan Laravel & PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql mbstring bcmath gd

# Copy Composer dari official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set folder kerja
WORKDIR /var/www/html

# Copy semua file proyek
COPY . .

# Install dependensi PHP (Laravel)
RUN composer install --no-dev --optimize-autoloader

# Install dependensi NPM & build aset React/Inertia
RUN npm install && npm run build

# Jalankan server Laravel
CMD php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
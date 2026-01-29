#!/bin/sh
set -e

echo "[Entrypoint] Setting up directories and permissions..."

# Create directories if they don't exist
mkdir -p /app/data
mkdir -p /app/public/uploads/favicons

# Set ownership to nextjs user (uid 1001)
chown -R 1001:1001 /app/data
chown -R 1001:1001 /app/public/uploads

# Set permissions to be writable
chmod -R 755 /app/data
chmod -R 755 /app/public/uploads

# Debug: show permissions
echo "[Entrypoint] Directory permissions:"
ls -la /app/data
ls -la /app/public/uploads

# Run database migrations as nextjs user
echo "[Entrypoint] Running database migrations..."
su-exec nextjs node dist/migrate.js

# Switch to nextjs user and run the app
echo "[Entrypoint] Starting application..."
exec su-exec nextjs node server.js

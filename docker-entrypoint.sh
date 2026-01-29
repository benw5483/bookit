#!/bin/sh
set -e

# Ensure data directories exist and have correct permissions
# This runs as root before switching to nextjs user

# Create directories if they don't exist
mkdir -p /app/data
mkdir -p /app/public/uploads/favicons

# Set ownership to nextjs user
chown -R nextjs:nodejs /app/data
chown -R nextjs:nodejs /app/public/uploads

# Run database migrations as nextjs user
echo "[Entrypoint] Running database migrations..."
su-exec nextjs node dist/migrate.js

# Switch to nextjs user and run the app
echo "[Entrypoint] Starting application..."
exec su-exec nextjs node server.js

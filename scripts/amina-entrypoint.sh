#!/bin/sh
# Entrypoint script to fix permissions for amina logs directory in development
# This is only needed for docker-compose.yml where we mount the host directory

# Fix ownership of logs directory to amina user (UID 1001, GID 1001)
# This ensures the amina user can write log files to the mounted volume
if [ -d /app/logs ]; then
    if ! chown -R 1001:1001 /app/logs; then
        echo "ERROR: chown failed for /app/logs" >&2
        exit 1
    fi
    if ! chmod -R 755 /app/logs; then
        echo "ERROR: chmod failed for /app/logs" >&2
        exit 1
    fi
fi

# Switch to amina user and execute the application with watch mode
# Using su without login shell flag to avoid sourcing login config files
exec su amina -c "cd /app && bun --watch ."

#!/bin/sh
# Entrypoint script to fix permissions for Lavalink plugins directory
# Similar to how Amina Dockerfile handles logs directory permissions

# Fix ownership of plugins directory to lavalink user (UID 322, GID 322)
# This ensures the lavalink user can write plugin JARs to the volume
if [ -d /opt/Lavalink/plugins ]; then
    chown -R 322:322 /opt/Lavalink/plugins
    chmod -R 755 /opt/Lavalink/plugins
fi

# Switch to lavalink user and execute the original Lavalink entrypoint
# Using su without login shell flag to avoid sourcing login config files
# Using full path to java to ensure it's found: /opt/java/openjdk/bin/java
exec su lavalink -c "cd /opt/Lavalink && /opt/java/openjdk/bin/java -jar Lavalink.jar"


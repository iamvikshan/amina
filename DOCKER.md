# Docker Deployment Guide for Amina

This guide explains how to deploy Amina Discord bot with Lavalink and Uptime
Kuma using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with your bot tokens and credentials

## Services Overview

### 1. Amina (Discord Bot)

- **Port**: 3000 (health endpoint)
- **Health Check**: `http://localhost:3000/health`
- **Configuration**: Uses `.env` file for secrets

### 2. Lavalink (Music Server)

- **Port**: 2333
- **Health Check**: `http://localhost:2333/version`
- **Authorization**: Uses `LAVALINK_PASSWORD_1` from `.env`
- **Configuration**: `lavalink/application.yml`

### 3. Uptime Kuma (Monitoring)

- **Port**: 3001
- **Web UI**: `http://localhost:3001`
- **Data**: Persisted in `uptime-kuma-data` volume

## Environment Variables

The Docker Compose setup automatically passes your `.env` file to the Amina
container. Key variables:

```bash
# Discord Bot
BOT_TOKEN=your_discord_bot_token
MONGO_CONNECTION=mongodb://your_mongo_connection

# Lavalink (Docker will override HOST to use container name)
LAVALINK_HOST_1=lavalink          # Set by docker-compose
LAVALINK_PORT_1=2333              # Set by docker-compose
LAVALINK_PASSWORD_1=youshallnotpass
LAVALINK_ID_1=Lavalink
LAVALINK_SECURE_1=false           # Set by docker-compose

# Fallback Lavalink (external)
LAVALINK_HOST_2=wispbyte1
LAVALINK_PORT_2=443
LAVALINK_PASSWORD_2=your_password
LAVALINK_ID_2=Lavalink2
LAVALINK_SECURE_2=true

# Health Check
HEALTH_PORT=3000
```

## Commands

### Start All Services

```bash
docker-compose up -d
```

### Start Specific Services (without building Amina)

```bash
docker-compose up -d lavalink uptime-kuma
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f lavalink
docker-compose logs -f uptime-kuma
docker-compose logs -f amina
```

### Check Status

```bash
docker-compose ps
```

### Stop Services

```bash
docker-compose down
```

⚠️ **IMPORTANT**: This keeps your Uptime Kuma data safe!

### Stop and Remove Volumes (DANGEROUS!)

```bash
docker-compose down -v
```

❌ **WARNING**: This will **DELETE** all data including:

- Uptime Kuma monitors, settings, and history
- Lavalink cached plugins

**Only use this if you want to completely reset everything!**

### Rebuild Containers Without Losing Data

```bash
# Stop containers (keeps volumes)
docker-compose down

# Remove old images (optional)
docker rmi amina-amina

# Rebuild and restart
docker-compose up -d --build
```

✅ **Safe**: Your Uptime Kuma data persists across rebuilds!

## Service Configuration

### Lavalink Configuration

Edit `lavalink/application.yml` to customize:

- Sources (YouTube, SoundCloud, etc.)
- Filters and audio effects
- Buffer settings
- Memory allocation
- **Plugins** (see below)

To change memory:

```yaml
environment:
  - _JAVA_OPTIONS=-Xmx1G # Increase to 1GB
```

#### Adding Lavalink Plugins

Plugins are automatically downloaded from Maven repositories. Add them to
`lavalink/application.yml`:

```yaml
lavalink:
  plugins:
    # YouTube plugin (recommended)
    - dependency: 'dev.lavalink.youtube:youtube-plugin:1.11.0'
      repository: 'https://maven.lavalink.dev/releases'

    # Spotify plugin (optional)
    - dependency: 'com.github.topi314.lavasrc:lavasrc-plugin:4.4.0'
      repository: 'https://maven.lavalink.dev/releases'

    # Add more plugins as needed
```

**Popular plugins:**

- **YouTube Plugin**: Better YouTube support than the deprecated built-in source
- **LavaSrc**: Spotify, Apple Music, Deezer, Yandex Music support
- **SponsorBlock**: Skip sponsored segments in videos

After adding plugins, restart Lavalink:

```bash
docker-compose restart lavalink
docker-compose logs -f lavalink  # Watch download progress
```

The plugins will be downloaded to `lavalink/plugins/` and cached for future
restarts.

### Uptime Kuma Setup

1. Access the web UI at `http://localhost:3001`
2. Create an admin account (first time setup)
3. Add monitors:

💾 **Note**: Your account, monitors, and settings are stored in the
`uptime-kuma-data` Docker volume. They will persist across container restarts
and updates as long as you don't use `docker-compose down -v`.

**Monitor Amina Health:**

- Type: HTTP(s)
- URL: `http://amina:3000/health`
- Expected Status: 200
- Heartbeat Interval: 60 seconds

**Monitor Lavalink:**

- Type: HTTP(s)
- URL: `http://lavalink:2333/version`
- Auth Header Name: `Authorization`
- Auth Header Value: `youshallnotpass`
- Expected Status: 200
- Heartbeat Interval: 60 seconds

**Monitor External Services:**

- Discord API: `https://discord.com/api/v10/gateway`
- MongoDB: Use TCP monitor if accessible
- Wispbyte1 Lavalink: `https://wispbyte1:443/version`

## Networking

All services communicate via the `amina-network` bridge network:

- Amina connects to Lavalink at `lavalink:2333`
- Uptime Kuma monitors services using container names
- Services are isolated from host network (except exposed ports)

## Volume Management

⚠️ **CRITICAL**: Docker volumes persist your data. **Never use
`docker-compose down -v`** unless you want to delete all data!

### Understanding Volume Persistence

| Command                        | Containers   | Volumes        | Uptime Kuma Data |
| ------------------------------ | ------------ | -------------- | ---------------- |
| `docker-compose down`          | ✅ Removed   | ✅ **Kept**    | ✅ **Safe**      |
| `docker-compose down -v`       | ❌ Removed   | ❌ **Deleted** | ❌ **Lost!**     |
| `docker-compose restart`       | ♻️ Restarted | ✅ Kept        | ✅ Safe          |
| `docker-compose up -d --build` | ♻️ Rebuilt   | ✅ Kept        | ✅ Safe          |

### Uptime Kuma Data

```bash
# Backup (recommended before major changes)
docker run --rm -v amina_uptime-kuma-data:/data -v $(pwd):/backup alpine tar czf /backup/uptime-kuma-backup.tar.gz -C /data .

# Restore
docker run --rm -v amina_uptime-kuma-data:/data -v $(pwd):/backup alpine tar xzf /backup/uptime-kuma-backup.tar.gz -C /data

# Verify backup
tar -tzf uptime-kuma-backup.tar.gz | grep kuma.db
```

### Lavalink Plugins

Lavalink **automatically downloads plugins** from URLs specified in
`lavalink/application.yml`:

```yaml
lavalink:
  plugins:
    - dependency: 'dev.lavalink.youtube:youtube-plugin:1.11.0'
      repository: 'https://maven.lavalink.dev/releases'
```

The `lavalink/plugins/` directory is used to **cache** downloaded plugins, so
Lavalink doesn't re-download them on every restart. You don't need to manually
place any `.jar` files there.

**To add more plugins**, simply add them to `application.yml` and restart
Lavalink.

## Health Checks

All services have built-in health checks:

- **Amina**: Checks every 30s, 3 retries, 40s startup grace period
- **Lavalink**: Checks every 30s, 3 retries, 20s startup grace period
- **Uptime Kuma**: Checks every 60s, 3 retries, 30s startup grace period

View health status:

```bash
docker-compose ps
```

## Troubleshooting

### Lavalink Not Starting

```bash
# Check logs
docker-compose logs lavalink

# Common issues:
# - Port 2333 already in use
# - Insufficient memory (increase _JAVA_OPTIONS)
# - Invalid application.yml syntax
```

### Amina Can't Connect to Lavalink

```bash
# Verify network connectivity
docker exec amina-bot ping lavalink

# Check environment variables
docker exec amina-bot env | grep LAVALINK
```

### Uptime Kuma Data Lost

**Most common cause**: Used `docker-compose down -v` which deletes volumes!

```bash
# Check if volume exists
docker volume ls | grep uptime-kuma

# If volume exists but is empty
docker volume inspect amina_uptime-kuma-data

# Restore from backup (see Volume Management section)
```

**Prevention**:

- ✅ Always use `docker-compose down` (without `-v`)
- 🔄 Use `docker-compose restart` for updates
- 💾 Backup regularly before major changes

## Production Deployment

1. **Set Strong Passwords**: Update `LAVALINK_PASSWORD_1` in `.env`
2. **Use External MongoDB**: Set proper `MONGO_CONNECTION` string
3. **Configure Reverse Proxy**: Use Nginx/Caddy for HTTPS
4. **Enable Monitoring**: Set up alerts in Uptime Kuma
5. **Schedule Backups**: Automate Uptime Kuma data backups
6. **Resource Limits**: Add memory/CPU limits in docker-compose:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 1G
   ```

## Updating Services

### Update Amina

```bash
git pull
docker-compose build amina
docker-compose up -d amina
```

### Update Lavalink

```bash
docker-compose pull lavalink
docker-compose up -d lavalink
```

### Update Uptime Kuma

```bash
docker-compose pull uptime-kuma
docker-compose up -d uptime-kuma
```

## Security Notes

1. **Never commit `.env`**: Already in `.gitignore`
2. **Use secrets management**: Consider Docker Secrets for production
3. **Network isolation**: Services are on private bridge network
4. **Regular updates**: Keep base images updated
5. **Monitoring**: Enable Uptime Kuma notifications for downtime alerts

---

# VPS Deployment Guide for Amina

## 📦 Files Needed on VPS

```
/opt/amina/
├── docker-compose.yml       (use docker-compose.prod.yml)
├── .env                     (your production secrets)
└── lavalink/
    ├── application.yml      (Lavalink config - includes plugin URLs)
    └── plugins/            (auto-created for plugin caching)
```

**Note**: The `plugins/` folder will be automatically created by Lavalink to
cache downloaded plugins. You don't need to create it or add any files manually.

## 🚀 Quick Deployment Steps

### 1. Create deployment directory

```bash
ssh user@your-vps
mkdir -p /opt/amina/lavalink
cd /opt/amina
```

**Note**: Don't create the `plugins/` folder manually - Lavalink will create it
automatically.

### 2. Copy files to VPS

```bash
# From your local machine
scp docker-compose.prod.yml user@your-vps:/opt/amina/docker-compose.yml
scp .env user@your-vps:/opt/amina/.env
scp lavalink/application.yml user@your-vps:/opt/amina/lavalink/application.yml
```

**Note**: Only `application.yml` needs to be copied. Plugins will be
automatically downloaded from the URLs specified in the config.

### 3. Update Lavalink password

**IMPORTANT**: Edit `/opt/amina/lavalink/application.yml` on your VPS and
change:

```yaml
lavalink:
  server:
    password: 'your-secure-production-password' # Change this!
```

Make sure this matches `LAVALINK_PASSWORD_1` in your `.env` file.

### 4. Start services

```bash
cd /opt/amina
docker-compose pull  # Pull latest images
docker-compose up -d
```

### 5. Verify deployment

```bash
docker-compose ps
docker-compose logs -f amina
```

## 🔐 Security Notes

### Lavalink Password Security

⚠️ **The Lavalink password is in TWO places:**

1. `.env` → `LAVALINK_PASSWORD_1=your-password` (used by Amina to connect)
2. `lavalink/application.yml` → `password: 'your-password'` (used by Lavalink
   server)

**These MUST match!**

### Recommended Production Setup

```bash
# Generate a strong password
openssl rand -base64 32

# Update both files with this password
```

### Firewall Configuration

```bash
# Only expose Uptime Kuma (if needed)
ufw allow 3001/tcp

# Block direct access to Lavalink and Amina health
# They communicate via internal Docker network
ufw deny 2333/tcp
ufw deny 3000/tcp
```

## 📊 Monitoring Setup

### Access Uptime Kuma

1. Open `http://your-vps-ip:3001` in browser
2. Create admin account (first time only)
3. Add monitors:

**Monitor Amina:**

- Name: Amina Bot
- Type: HTTP(s)
- URL: `http://amina:3000/health`
- Heartbeat: 60 seconds

**Monitor Lavalink:**

- Name: Lavalink Local
- Type: HTTP(s)
- URL: `http://lavalink:2333/version`
- Auth Header Name: `Authorization`
- Auth Header Value: `your-password-here`
- Heartbeat: 60 seconds

**Monitor External Lavalink (fallback):**

- Name: Lavalink Wispbyte2
- Type: HTTP(s)
- URL: `http://217.160.125.126:14316/version`
- Auth Header Name: `Authorization`
- Auth Header Value: `incorrect`
- Heartbeat: 120 seconds

## 🔄 Updates

### Update Amina to latest version

```bash
cd /opt/amina
docker-compose pull amina
docker-compose up -d amina
```

### Update all services

```bash
docker-compose pull
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f           # All services
docker-compose logs -f amina     # Just Amina
docker-compose logs -f lavalink  # Just Lavalink
```

### Stop services safely (keeps data!)

```bash
docker-compose down
```

⚠️ **NEVER use `docker-compose down -v` on production** - it will delete all
Uptime Kuma data!

## 🛠️ Troubleshooting

### Amina can't connect to Lavalink

```bash
# Check if Lavalink is running
docker-compose ps lavalink

# Check Lavalink logs
docker-compose logs lavalink

# Test Lavalink connection
docker exec amina-bot curl -H "Authorization: your-password" http://lavalink:2333/version
```

### Password mismatch error

- Ensure `LAVALINK_PASSWORD_1` in `.env` matches `password` in
  `lavalink/application.yml`
- Restart both services after changing:
  ```bash
  docker-compose restart lavalink amina
  ```

### Out of memory

```bash
# Increase Lavalink memory in docker-compose.yml
# Change: _JAVA_OPTIONS=-Xmx512M
# To: _JAVA_OPTIONS=-Xmx1G

docker-compose up -d lavalink
```

## 🔒 Production Checklist

- [ ] Strong Lavalink password set (32+ characters)
- [ ] Password matches in both `.env` and `application.yml`
- [ ] Firewall configured (only port 3001 public if needed)
- [ ] Uptime Kuma monitors configured
- [ ] Backups scheduled for Uptime Kuma data volume
- [ ] Discord bot token is production token (not dev)
- [ ] MongoDB connection is production database
- [ ] All webhooks point to production endpoints
- [ ] Test failover to external Lavalink (wispbyte2)

## 📁 File Structure on VPS

```
/opt/amina/
├── docker-compose.yml          # Production compose file
├── .env                        # Production secrets (chmod 600)
└── lavalink/
    ├── application.yml         # Lavalink config (update password!)
    └── plugins/               # Auto-created by Lavalink for plugin caching
```

**Note**: Plugins are defined in `application.yml` and automatically downloaded
on first startup.

## 🎯 Expected Behavior

After deployment:

- Amina connects to local Lavalink first (`lavalink:2333`)
- If local Lavalink fails, uses wispbyte2 as fallback
- Uptime Kuma monitors both Lavalink instances
- All services restart automatically if they crash
- Data persists in Docker volumes (Uptime Kuma)

---

**Need help?** Check logs with `docker-compose logs -f` or create an issue on
GitHub.


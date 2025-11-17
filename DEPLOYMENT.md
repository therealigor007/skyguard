# 🚀 SkyGuard Deployment Guide

Comprehensive guide for deploying SkyGuard to production servers with load balancing.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Server Requirements](#server-requirements)
- [Initial Setup](#initial-setup)
- [Manual Deployment](#manual-deployment)
- [Automated Deployment](#automated-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup Strategies](#backup-strategies)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

SkyGuard uses a 3-server architecture for high availability:

```
                    Internet
                       │
                       ▼
            ┌──────────────────┐
            │  Load Balancer   │
            │    (lb01)        │
            │  Nginx - Port 80 │
            └────────┬─────────┘
                     │
        ┏━━━━━━━━━━━━┻━━━━━━━━━━━━┓
        ▼                          ▼
┌───────────────┐          ┌───────────────┐
│  Web Server 1 │          │  Web Server 2 │
│   (web01)     │          │   (web02)     │
├───────────────┤          ├───────────────┤
│  Next.js      │          │  Next.js      │
│  Port 3000    │          │  Port 3000    │
├───────────────┤          ├───────────────┤
│  Express.js   │          │  Express.js   │
│  Port 5000    │          │  Port 5000    │
└───────────────┘          └───────────────┘
        │                          │
        └──────────┬───────────────┘
                   ▼
          External APIs
        (OpenSky, USGS, NASA)
```

## Server Requirements

### Minimum Requirements (per server)

**Web Servers (web01, web02)**:
- **OS**: Ubuntu 20.04 LTS or newer
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps

**Load Balancer (lb01)**:
- **OS**: Ubuntu 20.04 LTS or newer
- **CPU**: 1 core
- **RAM**: 2 GB
- **Storage**: 10 GB SSD
- **Network**: 100 Mbps

### Recommended Requirements (per server)

**Web Servers (web01, web02)**:
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps

**Load Balancer (lb01)**:
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 1 Gbps

### Software Requirements

- Node.js 18.x or 20.x LTS
- npm 8.x or higher
- Nginx 1.18 or higher
- Git 2.x
- systemd

## Initial Setup

### Option 1: Automated Setup (Recommended)

Use the provided setup script for quick deployment:

```bash
cd deploy
./setup-servers.sh <web01_ip> <web02_ip> <lb01_ip>
```

This script will:
1. Install all required software
2. Clone the repository
3. Install dependencies
4. Build the frontend
5. Configure systemd services
6. Set up the load balancer
7. Configure firewall rules

**Example**:
```bash
./setup-servers.sh 192.168.1.10 192.168.1.11 192.168.1.12
```

### Option 2: Manual Setup

If you prefer manual setup or need to customize the process:

#### Step 1: Prepare Servers

On each server (web01, web02, lb01):

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Set timezone
sudo timedatectl set-timezone UTC
```

#### Step 2: Install Node.js (web01, web02 only)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### Step 3: Install Git (all servers)

```bash
sudo apt-get install -y git
git --version
```

#### Step 4: Clone Repository (web01, web02)

```bash
# Create application directory
sudo mkdir -p /var/www/skyguard
sudo chown $USER:$USER /var/www/skyguard

# Clone repository
cd /var/www/skyguard
git clone https://github.com/therealigor007/skyguard.git .
```

#### Step 5: Configure Backend (web01, web02)

```bash
cd /var/www/skyguard/skyguard-bff

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env

# Edit environment file
nano .env
```

**Backend .env configuration**:
```bash
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
CACHE_DURATION=30
OPENSKY_RATE_LIMIT=10000
USGS_RATE_LIMIT=60000
EONET_RATE_LIMIT=60000
```

#### Step 6: Configure Frontend (web01, web02)

```bash
cd /var/www/skyguard/skyguard-client

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit environment file
nano .env.local
```

**Frontend .env.local configuration**:
```bash
NEXT_PUBLIC_API_URL=http://your-domain.com
NEXT_PUBLIC_REFRESH_INTERVAL=30000
NEXT_PUBLIC_MAP_DEFAULT_LAT=0
NEXT_PUBLIC_MAP_DEFAULT_LON=0
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=2
```

#### Step 7: Build Frontend (web01, web02)

```bash
cd /var/www/skyguard/skyguard-client
npm run build
```

#### Step 8: Set Up Systemd Services (web01, web02)

```bash
# Copy service files
sudo cp /var/www/skyguard/deploy/skyguard-backend.service /etc/systemd/system/
sudo cp /var/www/skyguard/deploy/skyguard-frontend.service /etc/systemd/system/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/skyguard

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable skyguard-backend
sudo systemctl enable skyguard-frontend

# Start services
sudo systemctl start skyguard-backend
sudo systemctl start skyguard-frontend

# Check status
sudo systemctl status skyguard-backend
sudo systemctl status skyguard-frontend
```

#### Step 9: Install and Configure Nginx (lb01 only)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Clone repository for config files
git clone https://github.com/therealigor007/skyguard.git /tmp/skyguard

# Copy Nginx configuration
sudo cp /tmp/skyguard/deploy/nginx.conf /etc/nginx/sites-available/skyguard

# Edit configuration
sudo nano /etc/nginx/sites-available/skyguard
```

**Update these lines in nginx.conf**:
- Change `server_name` to your domain
- Update `web01` and `web02` to actual IP addresses or hostnames

```nginx
# Example:
upstream skyguard_frontend {
    server 192.168.1.10:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:3000 max_fails=3 fail_timeout=30s;
}

upstream skyguard_backend {
    server 192.168.1.10:5000 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:5000 max_fails=3 fail_timeout=30s;
}
```

Enable the site:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/skyguard /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Step 10: Configure Firewall (all servers)

**Web Servers (web01, web02)**:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (for health checks)
sudo ufw allow 3000/tcp  # Next.js
sudo ufw allow 5000/tcp  # Express.js
sudo ufw --force enable
```

**Load Balancer (lb01)**:
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

## Automated Deployment

After initial setup, use the deployment script for updates:

```bash
cd deploy
./deploy.sh <web01_ip> <web02_ip> <lb01_ip>
```

This script will:
1. Pull latest code from git
2. Install dependencies
3. Build frontend
4. Restart services
5. Verify health endpoints
6. Reload Nginx configuration

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

#### Step 1: Install Certbot (lb01)

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

#### Step 2: Obtain Certificate

```bash
# Make sure your domain points to lb01 IP
# Replace your-domain.com with your actual domain

sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to:
- Enter email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

#### Step 3: Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

The certificate will auto-renew every 60 days.

#### Step 4: Update Nginx Configuration

Certbot automatically updates your Nginx config, but verify:

```bash
sudo nano /etc/nginx/sites-available/skyguard
```

You should see SSL configuration added automatically.

### Using Custom SSL Certificate

If you have your own SSL certificate:

```bash
# Copy certificate files to server
sudo mkdir -p /etc/ssl/skyguard
sudo cp your-certificate.crt /etc/ssl/skyguard/
sudo cp your-private-key.key /etc/ssl/skyguard/
sudo chmod 600 /etc/ssl/skyguard/your-private-key.key
```

Edit `/etc/nginx/sites-available/skyguard`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/skyguard/your-certificate.crt;
    ssl_certificate_key /etc/ssl/skyguard/your-private-key.key;

    # ... rest of configuration
}
```

## Monitoring and Logging

### Service Status

Check service status on web servers:

```bash
# Backend status
sudo systemctl status skyguard-backend

# Frontend status
sudo systemctl status skyguard-frontend

# View logs
sudo journalctl -u skyguard-backend -n 50
sudo journalctl -u skyguard-frontend -n 50

# Follow logs in real-time
sudo journalctl -u skyguard-backend -f
```

### Nginx Logs

On load balancer:

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

Monitor application health:

```bash
# Check backend health
curl http://lb01-ip/health

# Check if frontend is responding
curl -I http://lb01-ip/

# From web servers directly
curl http://localhost:5000/health  # Backend
curl http://localhost:3000/        # Frontend
```

### Resource Monitoring

Install monitoring tools:

```bash
# Install htop for process monitoring
sudo apt-get install -y htop

# Install netstat for network monitoring
sudo apt-get install -y net-tools

# Monitor CPU and memory
htop

# Monitor network connections
sudo netstat -tulpn | grep -E '3000|5000|80|443'

# Monitor disk usage
df -h

# Monitor disk I/O
sudo iotop
```

### Setting Up Automated Monitoring

Create a monitoring script (`/usr/local/bin/skyguard-monitor.sh`):

```bash
#!/bin/bash

# Health check script
HEALTH_URL="http://localhost:5000/health"
ALERT_EMAIL="admin@your-domain.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$response" != "200" ]; then
    echo "SkyGuard backend health check failed!" | mail -s "SkyGuard Alert" $ALERT_EMAIL
fi
```

Add to crontab:
```bash
sudo crontab -e

# Add this line to check every 5 minutes
*/5 * * * * /usr/local/bin/skyguard-monitor.sh
```

## Backup Strategies

### Application Code

Code is in Git, so regular commits serve as backup. Ensure you:
- Push to remote repository regularly
- Tag releases: `git tag -a v1.0.0 -m "Release 1.0.0"`
- Push tags: `git push origin --tags`

### Configuration Files

Backup environment files and configs:

```bash
# Create backup script
cat > /usr/local/bin/backup-skyguard.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/skyguard"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup environment files
tar czf $BACKUP_DIR/env-$DATE.tar.gz \
    /var/www/skyguard/skyguard-bff/.env \
    /var/www/skyguard/skyguard-client/.env.local

# Backup Nginx config
tar czf $BACKUP_DIR/nginx-$DATE.tar.gz \
    /etc/nginx/sites-available/skyguard

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-skyguard.sh

# Run daily at 2 AM
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-skyguard.sh
```

### Database Backup

If you add a database in the future:

```bash
# Example for PostgreSQL
pg_dump skyguard_db > /var/backups/skyguard/db-$(date +%Y%m%d).sql

# Example for MongoDB
mongodump --db skyguard_db --out /var/backups/skyguard/mongo-$(date +%Y%m%d)
```

## Scaling Considerations

### Vertical Scaling

Upgrade server resources:
- Increase CPU cores for better concurrent request handling
- Add more RAM for caching and better performance
- Use faster SSD storage for improved I/O

### Horizontal Scaling

Add more web servers:

1. **Provision new server** (web03, web04, etc.)
2. **Run setup script** or manual setup
3. **Update Nginx configuration** on lb01:

```nginx
upstream skyguard_frontend {
    server web01:3000 max_fails=3 fail_timeout=30s;
    server web02:3000 max_fails=3 fail_timeout=30s;
    server web03:3000 max_fails=3 fail_timeout=30s;  # New server
    server web04:3000 max_fails=3 fail_timeout=30s;  # New server
}

upstream skyguard_backend {
    server web01:5000 max_fails=3 fail_timeout=30s;
    server web02:5000 max_fails=3 fail_timeout=30s;
    server web03:5000 max_fails=3 fail_timeout=30s;  # New server
    server web04:5000 max_fails=3 fail_timeout=30s;  # New server
}
```

4. **Reload Nginx**: `sudo nginx -t && sudo systemctl reload nginx`

### CDN Integration

For static assets:
1. Configure Next.js to use CDN for static files
2. Update `next.config.mjs`:

```javascript
const nextConfig = {
  assetPrefix: process.env.CDN_URL || '',
};
```

### Caching Strategy

Increase cache duration for less frequently changing data:

```bash
# In skyguard-bff/.env
CACHE_DURATION=60  # Increase from 30 to 60 seconds
```

## Troubleshooting

### Backend Service Won't Start

```bash
# Check logs
sudo journalctl -u skyguard-backend -n 100

# Common issues:
# 1. Port already in use
sudo netstat -tlnp | grep 5000
sudo kill <pid>

# 2. Missing dependencies
cd /var/www/skyguard/skyguard-bff
npm install

# 3. Environment file issues
cat /var/www/skyguard/skyguard-bff/.env
```

### Frontend Service Won't Start

```bash
# Check logs
sudo journalctl -u skyguard-frontend -n 100

# Common issues:
# 1. Build failed
cd /var/www/skyguard/skyguard-client
npm run build

# 2. Port conflict
sudo netstat -tlnp | grep 3000

# 3. Missing .env.local
ls -la /var/www/skyguard/skyguard-client/.env.local
```

### Nginx 502 Bad Gateway

```bash
# Check if backend services are running
sudo systemctl status skyguard-backend
sudo systemctl status skyguard-frontend

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|5000'

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Test upstream servers manually
curl http://web01:5000/health
curl http://web02:5000/health
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Find memory-intensive processes
ps aux --sort=-%mem | head

# Restart services to free memory
sudo systemctl restart skyguard-backend
sudo systemctl restart skyguard-frontend
```

### Slow API Responses

```bash
# Check external API connectivity
curl -w "@curl-format.txt" https://opensky-network.org/api/states/all

# Increase cache duration
nano /var/www/skyguard/skyguard-bff/.env
# Set CACHE_DURATION=60 or higher

# Check server resources
htop
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

## Security Best Practices

1. **Keep Software Updated**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

2. **Use Firewall**
   - Only open necessary ports
   - Use fail2ban for brute-force protection

3. **Regular Backups**
   - Automate daily backups
   - Test restore procedures

4. **Monitor Logs**
   - Set up log rotation
   - Monitor for suspicious activity

5. **Use HTTPS**
   - Always use SSL/TLS in production
   - Enable HSTS headers

6. **Environment Variables**
   - Never commit .env files
   - Use strong, unique values

## Support

For deployment issues:
- GitHub Issues: https://github.com/therealigor007/skyguard/issues
- Documentation: https://github.com/therealigor007/skyguard

## Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure backups
3. Enable HTTPS
4. Set up CI/CD pipeline
5. Configure logging aggregation
6. Implement performance monitoring

---

**Last Updated**: November 2024

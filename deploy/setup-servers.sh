#!/bin/bash
# setup-servers.sh: Installs Nginx and fixes permissions.

# Check for root permissions (run with sudo on server)
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root or with sudo."
    exit 1
fi

echo "--- Starting Server Setup ---"

# 1. Install Nginx
echo "Updating and installing Nginx..."
apt-get update -y
apt-get install nginx -y

# 2. Start Service
systemctl start nginx
systemctl enable nginx

# 3. Fix Permissions (CRITICAL STEP)
# This allows the 'ubuntu' user to upload files to the web directory without 'sudo'
echo "Fixing permissions for /var/www/html..."
chown -R ubuntu:ubuntu /var/www/html
chmod -R 755 /var/www/html

# 4. Cleanup
rm -f /var/www/html/index.nginx-debian.html

echo "--- Server Ready for Deployment ---"
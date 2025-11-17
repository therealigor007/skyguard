#!/bin/bash
#
# SkyGuard Initial Server Setup Script
# Usage: ./setup-servers.sh <web01_ip> <web02_ip> <lb01_ip>
#
# This script performs initial setup on fresh Ubuntu servers:
# - Installs Node.js, npm, nginx, git
# - Creates directory structure
# - Clones repository
# - Configures systemd services
# - Sets up firewall
#

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 3 ]; then
    echo -e "${RED}Error: Invalid number of arguments${NC}"
    echo "Usage: $0 <web01_ip> <web02_ip> <lb01_ip>"
    echo "Example: $0 192.168.1.10 192.168.1.11 192.168.1.12"
    exit 1
fi

WEB01_IP=$1
WEB02_IP=$2
LB01_IP=$3

APP_DIR="/var/www/skyguard"
REPO_URL="https://github.com/therealigor007/skyguard.git"
NODE_VERSION="20"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SkyGuard Server Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Web Server 1: $WEB01_IP"
echo "Web Server 2: $WEB02_IP"
echo "Load Balancer: $LB01_IP"
echo ""

# Function to setup a web server
setup_web_server() {
    local SERVER_IP=$1
    local SERVER_NAME=$2
    
    echo -e "${YELLOW}Setting up $SERVER_NAME ($SERVER_IP)...${NC}"
    
    ssh -o StrictHostKeyChecking=no root@$SERVER_IP << ENDSSH
        set -e
        
        echo "Updating system packages..."
        apt-get update
        apt-get upgrade -y
        
        echo "Installing Node.js $NODE_VERSION..."
        curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
        apt-get install -y nodejs
        
        echo "Installing Git..."
        apt-get install -y git
        
        echo "Verifying installations..."
        node --version
        npm --version
        git --version
        
        echo "Creating application directory..."
        mkdir -p $APP_DIR
        cd $APP_DIR
        
        echo "Cloning repository..."
        if [ -d ".git" ]; then
            echo "Repository already exists, pulling latest..."
            git pull origin main
        else
            git clone $REPO_URL .
        fi
        
        echo "Installing backend dependencies..."
        cd skyguard-bff
        npm install --production
        
        echo "Creating backend .env file..."
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "Created .env from .env.example - please configure it!"
        fi
        
        echo "Installing frontend dependencies..."
        cd ../skyguard-client
        npm install
        
        echo "Creating frontend .env.local file..."
        if [ ! -f .env.local ]; then
            cp .env.local.example .env.local
            echo "Created .env.local from .env.local.example - please configure it!"
        fi
        
        echo "Building frontend..."
        npm run build
        
        echo "Setting up systemd services..."
        cp ../deploy/skyguard-backend.service /etc/systemd/system/
        cp ../deploy/skyguard-frontend.service /etc/systemd/system/
        
        echo "Configuring file permissions..."
        chown -R www-data:www-data $APP_DIR
        
        echo "Enabling and starting services..."
        systemctl daemon-reload
        systemctl enable skyguard-backend
        systemctl enable skyguard-frontend
        systemctl start skyguard-backend
        systemctl start skyguard-frontend
        
        echo "Checking service status..."
        systemctl status skyguard-backend --no-pager | head -5
        systemctl status skyguard-frontend --no-pager | head -5
        
        echo "Configuring firewall..."
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp
        ufw allow 5000/tcp
        ufw --force enable
        
        echo "Setup completed on this server!"
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Setup of $SERVER_NAME successful!${NC}"
    else
        echo -e "${RED}✗ Setup of $SERVER_NAME failed!${NC}"
        return 1
    fi
}

# Function to setup load balancer
setup_load_balancer() {
    local SERVER_IP=$1
    
    echo -e "${YELLOW}Setting up Load Balancer ($SERVER_IP)...${NC}"
    
    ssh -o StrictHostKeyChecking=no root@$SERVER_IP << ENDSSH
        set -e
        
        echo "Updating system packages..."
        apt-get update
        apt-get upgrade -y
        
        echo "Installing Nginx..."
        apt-get install -y nginx git
        
        echo "Cloning repository for config files..."
        mkdir -p /tmp/skyguard-setup
        cd /tmp/skyguard-setup
        git clone $REPO_URL .
        
        echo "Copying Nginx configuration..."
        cp deploy/nginx.conf /etc/nginx/sites-available/skyguard
        
        echo "Creating symlink..."
        ln -sf /etc/nginx/sites-available/skyguard /etc/nginx/sites-enabled/skyguard
        
        echo "Removing default site..."
        rm -f /etc/nginx/sites-enabled/default
        
        echo "Testing Nginx configuration..."
        nginx -t
        
        echo "Enabling and starting Nginx..."
        systemctl enable nginx
        systemctl restart nginx
        
        echo "Configuring firewall..."
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        
        echo "Cleaning up..."
        rm -rf /tmp/skyguard-setup
        
        echo "Load balancer setup completed!"
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Load balancer setup successful!${NC}"
    else
        echo -e "${RED}✗ Load balancer setup failed!${NC}"
        return 1
    fi
}

# Setup Web Server 1
echo ""
echo -e "${GREEN}Step 1: Setting up Web Server 1${NC}"
setup_web_server $WEB01_IP "web01"

# Setup Web Server 2
echo ""
echo -e "${GREEN}Step 2: Setting up Web Server 2${NC}"
setup_web_server $WEB02_IP "web02"

# Setup Load Balancer
echo ""
echo -e "${GREEN}Step 3: Setting up Load Balancer${NC}"
setup_load_balancer $LB01_IP

# Final summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ SETUP COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure environment variables on web servers:"
echo "   - Edit $APP_DIR/skyguard-bff/.env on both web servers"
echo "   - Edit $APP_DIR/skyguard-client/.env.local on both web servers"
echo ""
echo "2. Update Nginx configuration on load balancer:"
echo "   - Edit /etc/nginx/sites-available/skyguard"
echo "   - Update server_name to your domain"
echo "   - Update upstream server IPs if using hostnames"
echo ""
echo "3. Configure SSL certificates (recommended for production):"
echo "   - Install certbot: apt-get install certbot python3-certbot-nginx"
echo "   - Run: certbot --nginx -d your-domain.com"
echo ""
echo "4. Restart services after configuration:"
echo "   - systemctl restart skyguard-backend"
echo "   - systemctl restart skyguard-frontend"
echo "   - systemctl restart nginx"
echo ""
echo "Access the application at: http://$LB01_IP"
echo "Backend health check: http://$LB01_IP/health"
echo ""

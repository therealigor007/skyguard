#!/bin/bash
#
# SkyGuard Automated Deployment Script
# Usage: ./deploy.sh <web01_ip> <web02_ip> <lb01_ip>
#
# This script deploys the latest code to all servers, builds the application,
# and restarts services.
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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SkyGuard Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Web Server 1: $WEB01_IP"
echo "Web Server 2: $WEB02_IP"
echo "Load Balancer: $LB01_IP"
echo ""

# Function to deploy to a web server
deploy_to_web_server() {
    local SERVER_IP=$1
    local SERVER_NAME=$2
    
    echo -e "${YELLOW}Deploying to $SERVER_NAME ($SERVER_IP)...${NC}"
    
    # SSH into server and execute deployment commands
    ssh -o StrictHostKeyChecking=no root@$SERVER_IP << 'ENDSSH'
        set -e
        
        echo "Pulling latest code..."
        cd /var/www/skyguard
        git pull origin main
        
        echo "Installing backend dependencies..."
        cd skyguard-bff
        npm install --production
        
        echo "Installing frontend dependencies..."
        cd ../skyguard-client
        npm install
        
        echo "Building frontend..."
        npm run build
        
        echo "Restarting services..."
        systemctl restart skyguard-backend
        systemctl restart skyguard-frontend
        
        echo "Checking service status..."
        systemctl status skyguard-backend --no-pager | head -3
        systemctl status skyguard-frontend --no-pager | head -3
        
        echo "Deployment completed on this server!"
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deployment to $SERVER_NAME successful!${NC}"
    else
        echo -e "${RED}✗ Deployment to $SERVER_NAME failed!${NC}"
        return 1
    fi
}

# Function to verify health endpoint
check_health() {
    local SERVER_IP=$1
    local SERVER_NAME=$2
    local PORT=$3
    
    echo -e "${YELLOW}Checking health endpoint on $SERVER_NAME:$PORT...${NC}"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:$PORT/health || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Health check passed on $SERVER_NAME:$PORT${NC}"
        return 0
    else
        echo -e "${RED}✗ Health check failed on $SERVER_NAME:$PORT (HTTP $RESPONSE)${NC}"
        return 1
    fi
}

# Deploy to Web Server 1
echo ""
echo -e "${GREEN}Step 1: Deploying to Web Server 1${NC}"
deploy_to_web_server $WEB01_IP "web01"

# Deploy to Web Server 2
echo ""
echo -e "${GREEN}Step 2: Deploying to Web Server 2${NC}"
deploy_to_web_server $WEB02_IP "web02"

# Wait for services to start
echo ""
echo -e "${YELLOW}Waiting 10 seconds for services to start...${NC}"
sleep 10

# Verify health endpoints
echo ""
echo -e "${GREEN}Step 3: Verifying health endpoints${NC}"
HEALTH_CHECK_FAILED=0

check_health $WEB01_IP "web01-backend" 5000 || HEALTH_CHECK_FAILED=1
check_health $WEB02_IP "web02-backend" 5000 || HEALTH_CHECK_FAILED=1
check_health $WEB01_IP "web01-frontend" 3000 || HEALTH_CHECK_FAILED=1
check_health $WEB02_IP "web02-frontend" 3000 || HEALTH_CHECK_FAILED=1

# Update Nginx on load balancer (optional - if config changed)
echo ""
echo -e "${GREEN}Step 4: Updating load balancer${NC}"
echo -e "${YELLOW}Testing Nginx configuration on load balancer...${NC}"

ssh -o StrictHostKeyChecking=no root@$LB01_IP << 'ENDSSH'
    nginx -t && systemctl reload nginx
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx configuration reloaded successfully${NC}"
else
    echo -e "${RED}✗ Nginx configuration reload failed${NC}"
    HEALTH_CHECK_FAILED=1
fi

# Final summary
echo ""
echo -e "${GREEN}========================================${NC}"
if [ $HEALTH_CHECK_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}All services are running and healthy.${NC}"
else
    echo -e "${YELLOW}⚠ DEPLOYMENT COMPLETED WITH WARNINGS${NC}"
    echo -e "${YELLOW}Some health checks failed. Please investigate.${NC}"
fi
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access the application at: http://$LB01_IP"
echo "Backend API: http://$LB01_IP/api"
echo "Health check: http://$LB01_IP/health"
echo ""

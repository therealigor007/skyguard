#!/bin/bash
# deploy.sh: Deploys the SkyGuard app using the 'school' SSH key.

# --- Server Configuration ---
WEB01_IP="44.204.88.221"
WEB02_IP="52.91.16.179"
LB01_IP="54.174.137.211"
USER="ubuntu"
SSH_KEY="school" 

# --- Paths ---
REMOTE_PATH="/var/www/html/skyguard"
NGINX_CONFIG="deploy/nginx.conf"

echo "SkyGuard Deployment Started"

# 1. Safety Check: Are we in the project root?
if [ ! -f "index.html" ]; then
    echo "ERROR: index.html not found in current directory."
    echo "Please run this script from the project ROOT (school/skygs)."
    exit 1
fi

# 2. Safety Check: Does the key exist?
if [ ! -f "$SSH_KEY" ]; then
    echo "ERROR: SSH key '$SSH_KEY' not found in current directory."
    exit 1
fi

# Function to deploy to a specific web server
deploy_to_server() {
    SERVER_IP=$1
    NAME=$2

    echo "-------------------------------------------------"
    echo "Deploying to $NAME ($SERVER_IP)..."

    # A. Create destination folder
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}"

    # B. Upload files
    scp -i $SSH_KEY -o StrictHostKeyChecking=no -r index.html css js ${USER}@${SERVER_IP}:${REMOTE_PATH}/

    if [ $? -eq 0 ]; then
        echo "$NAME deployment successful."
    else
        echo "$NAME deployment FAILED."
        exit 1
    fi
}

# Function to configure the Load Balancer
configure_lb() {
    echo "-------------------------------------------------"
    echo "Configuring Load Balancer (Lb01)..."

    # A. Upload Nginx Config
    scp -i $SSH_KEY -o StrictHostKeyChecking=no ${NGINX_CONFIG} ${USER}@${LB01_IP}:/tmp/skyguard.conf

    # B. Remote Commands - INTELLIGENT PORT CLEANUP
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${USER}@${LB01_IP} "
        echo '🔍 Checking port 80 status...'
        
        # 1. Stop Apache if it exists (Common culprit on these servers)
        if systemctl is-active --quiet apache2; then
            echo ' Apache2 detected on port 80. Stopping it...'
            sudo systemctl stop apache2
            sudo systemctl disable apache2
        fi

        # 2. Kill any other process explicitly holding port 80 (using fuser)
        # This handles stuck Nginx processes or other random services
        if sudo lsof -t -i:80 >/dev/null; then
             echo ' Port 80 is still busy. Forcing release...'
             sudo fuser -k 80/tcp
        fi

        # 3. Move and Link Config
        echo 'Applying Nginx configuration...'
        sudo mv /tmp/skyguard.conf /etc/nginx/sites-available/skyguard.conf && \
        sudo ln -sf /etc/nginx/sites-available/skyguard.conf /etc/nginx/sites-enabled/ && \
        
        # 4. Remove Default Config (to avoid conflicts)
        sudo rm -f /etc/nginx/sites-enabled/default && \
        
        # 5. Test and Start Cleanly
        echo 'Starting Nginx...'
        sudo nginx -t && \
        sudo systemctl restart nginx
    "

    if [ $? -eq 0 ]; then
        echo "Load Balancer Configured & Started Successfully."
    else
        echo "Load Balancer Configuration Failed."
        exit 1
    fi
}

# --- Execute Deployment ---
deploy_to_server $WEB01_IP "Web01"
deploy_to_server $WEB02_IP "Web02"
configure_lb

echo "Deployment Complete!"
echo "Access your app: http://${LB01_IP}/skyguard/index.html"
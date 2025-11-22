#!/bin/bash
# deploy/fix-lb.sh: fix for Load Balancer Port 80 issues

LB01_IP="54.174.137.211"
USER="ubuntu"
SSH_KEY="school"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${USER}@${LB01_IP} "
    echo '1. Installing network tools...'
    sudo apt-get update -y
    sudo apt-get install -y lsof psmisc net-tools

    echo '2. Hunting for Port 80 blockers...'
    # Stop Apache2 (The usual suspect)
    if systemctl is-active --quiet apache2; then
        echo '   - Stopping Apache2...'
        sudo systemctl stop apache2
        sudo systemctl disable apache2
    fi

    # Kill anything else on Port 80
    if sudo lsof -t -i:80 >/dev/null; then
        echo '   - Port 80 is busy. Killing process...'
        sudo fuser -k 80/tcp
    else
        echo '   - Port 80 is clear.'
    fi

    echo '3. Resetting Nginx...'
    # Force stop to ensure clean slate
    sudo systemctl stop nginx
    
    # Start Nginx
    echo '   - Starting Nginx...'
    sudo systemctl start nginx

    # Verify
    if systemctl is-active --quiet nginx; then
        echo 'SUCCESS: Nginx is running!'
        echo '   - Listening Ports:'
        sudo netstat -tlpn | grep nginx
    else
        echo 'FAILURE: Nginx failed to start. Showing logs:'
        sudo journalctl -u nginx --no-pager -n 10
        exit 1
    fi
"
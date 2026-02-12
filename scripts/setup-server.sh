#!/bin/bash
# ============================================
# Server Setup Script for GCP VM
# Run this ONCE on the VM to install Docker
# ============================================

set -e

echo "=========================================="
echo "  HRIS Server Setup - Installing Docker"
echo "=========================================="

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group (no sudo needed)
sudo usermod -aG docker $USER

echo ""
echo "=========================================="
echo "  Docker installed successfully!"
echo "  Please log out and back in, then run:"
echo "    cd ~/hris && docker compose up -d --build"
echo "=========================================="

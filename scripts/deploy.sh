#!/bin/bash
# ============================================
# Deploy Script - Run from your LOCAL machine
# Copies project to VM and starts containers
# ============================================

set -e

VM_IP="136.112.30.58"
VM_USER="aqshol"          # Change to your GCP SSH username
REMOTE_DIR="~/hris"

echo "=========================================="
echo "  Deploying HRIS to $VM_IP"
echo "=========================================="

# Step 1: Copy project files to VM
echo "[1/3] Copying files to VM..."
gcloud compute scp --recurse \
  --zone=us-central1-c \
  /Users/aqshol/Documents/self/alta/be \
  /Users/aqshol/Documents/self/alta/fe \
  /Users/aqshol/Documents/self/alta/nginx \
  /Users/aqshol/Documents/self/alta/docker-compose.yml \
  /Users/aqshol/Documents/self/alta/scripts \
  sample-instance:${REMOTE_DIR}/

# Step 2: Build and start containers on VM
echo "[2/3] Building and starting containers..."
gcloud compute ssh sample-instance \
  --zone=us-central1-c \
  --command="cd ${REMOTE_DIR} && docker compose up -d --build"

# Step 3: Check status
echo "[3/3] Checking container status..."
gcloud compute ssh sample-instance \
  --zone=us-central1-c \
  --command="cd ${REMOTE_DIR} && docker compose ps"

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "  Access HRIS at: http://$VM_IP"
echo ""
echo "  Login credentials:"
echo "    Email:    admin@hris.com"
echo "    Password: admin123"
echo "=========================================="

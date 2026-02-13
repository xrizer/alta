#!/bin/bash
# ============================================
# Deploy Script - Run from your LOCAL machine
# Copies project to VM and starts containers
# ============================================

set -e

VM_IP="136.112.30.58"
VM_USER="aqshol"          # Change to your GCP SSH username
REMOTE_DIR="~/hris"
PROJECT_DIR="/Users/aqshol/Documents/self/alta"

echo "=========================================="
echo "  Deploying HRIS to $VM_IP"
echo "=========================================="

# Step 1: Create a clean tarball excluding build artifacts
echo "[1/4] Packaging project files..."
cd "$PROJECT_DIR"
tar czf /tmp/hris-deploy.tar.gz \
  --exclude='fe/node_modules' \
  --exclude='fe/.next' \
  --exclude='be/tmp' \
  --exclude='be/seed' \
  --exclude='.git' \
  be fe nginx docker-compose.yml scripts

# Step 2: Copy tarball to VM
echo "[2/4] Copying to VM..."
gcloud compute scp \
  --zone=us-central1-c \
  /tmp/hris-deploy.tar.gz \
  sample-instance:/tmp/hris-deploy.tar.gz

# Step 3: Extract and build on VM
echo "[3/4] Extracting and building containers..."
gcloud compute ssh sample-instance \
  --zone=us-central1-c \
  --command="mkdir -p ${REMOTE_DIR} && cd ${REMOTE_DIR} && tar xzf /tmp/hris-deploy.tar.gz && rm /tmp/hris-deploy.tar.gz && docker compose up -d --build"

# Step 4: Check status
echo "[4/4] Checking container status..."
gcloud compute ssh sample-instance \
  --zone=us-central1-c \
  --command="cd ${REMOTE_DIR} && docker compose ps"

# Clean up local tarball
rm -f /tmp/hris-deploy.tar.gz

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "  Access HRIS at: http://$VM_IP"
echo ""
echo "  Login credentials:"
echo "    Email:    admin@hris.com"
echo "    Password: admin123"
echo "=========================================="

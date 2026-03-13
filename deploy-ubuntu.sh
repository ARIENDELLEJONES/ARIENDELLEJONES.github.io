#!/bin/bash
# Deploy EDC,LTD Backend to Ubuntu server
set -e

echo "=== EDC,LTD Backend Deployment ==="
echo "Current dir: $(pwd)"
echo "Files:"

# Check current state
ls -la

# Extract if zip exists
if [ -f "edc-backend.zip" ] || [ -f "edc-backend-fixed.zip" ]; then
  ZIPFILE=$(ls edc-backend*.zip | head -1)
  echo "Extracting $ZIPFILE..."
  unzip -o "$ZIPFILE"
fi

# cd to backend
if [ ! -d "backend" ]; then
  echo "ERROR: backend/ dir not found. Check zip extraction."
  exit 1
fi
cd backend

# Install deps
echo "Installing npm dependencies..."
npm install

# Start server
echo "Starting server with npm start..."
npm start

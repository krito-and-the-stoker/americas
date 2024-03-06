#!/bin/bash

# Step 1: Build all frontend services (game, dashboard, wiki, assets)
echo "Building frontend services..."
docker compose build game dashboard wiki assets

# Step 1 is complete as these services do not need to be stopped or started for a build.

# Step 2: Update the backend service with minimal downtime
echo "Updating backend service..."
# Stop the backend service
docker compose stop backend
# Rebuild the backend service
docker compose build backend
# Start the backend service
docker compose up -d backend

# Step 3: Update the webserver service with minimal downtime
echo "Updating webserver service..."
# Stop the webserver service
docker compose stop webserver
# Rebuild the webserver service
docker compose build webserver
# Start the webserver service
docker compose up -d webserver

echo "Update process complete."

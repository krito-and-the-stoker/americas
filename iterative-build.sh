#!/bin/bash

# Step 1: Build all frontend services (game, dashboard, wiki, assets)
echo "Building frontend services..."
docker compose build game dashboard wiki assets

# Step 1 is complete now start them in order to propagate changes
echo "Starting frontend services..."
docker compose up -d game dashboard wiki assets

# Step 2: Update the backend service with minimal downtime
echo "Updating backend service..."
docker compose stop backend
docker compose build backend
docker compose up -d backend

# Step 3: Update the webserver service with minimal downtime
echo "Updating webserver service..."
docker compose stop webserver
docker compose build webserver
docker compose up -d webserver

echo "Updating backup service..."
docker compose stop backup
docker compose build backup
docker compose up -d backup

echo "Update process complete."

#!/bin/bash

asset_directory="/root/americas/assets"
target_directory="/root/americas/live"
log_file="./docker-build.log"

# Redirect output to the log file
exec >> "$log_file" 2>&1

echo "--------------------------------------------------------------------------------"
echo "Build started on: $(date)"

cp .env.backend $target_directory

cd $target_directory

cp -R $asset_directory/* ./assets/images

./iterative-build.sh
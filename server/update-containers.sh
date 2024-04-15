#!/bin/bash

target_directory="/mnt/volume_fra1_01/live"
log_file="./docker-build.log"

# Redirect output to the log file
exec >> "$log_file" 2>&1

echo "--------------------------------------------------------------------------------"
echo "Build started on: $(date)"

cp .env.backend $target_directory

cd $target_directory

./iterative-build.sh

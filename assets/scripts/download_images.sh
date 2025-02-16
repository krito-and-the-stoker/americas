#!/bin/bash

# Define variables
REMOTE_PATH="root@164.92.193.78:/root/americas-images/"
LOCAL_PATH="../images/"

# Run rsync
rsync -avzP --dry-run --include='*/' --include='*.jpg' --include='*.jpeg' --include='*.png' --exclude='*' "$REMOTE_PATH" "$LOCAL_PATH"

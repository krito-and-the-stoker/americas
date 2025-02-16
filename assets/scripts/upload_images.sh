#!/bin/bash

# Define variables
REMOTE_PATH="root@128.140.99.201:/root/americas/images/"
LOCAL_PATH="../images/"

# Run rsync
rsync -avzP "$LOCAL_PATH" "$REMOTE_PATH"

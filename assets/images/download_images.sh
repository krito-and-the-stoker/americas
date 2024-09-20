#!/bin/bash

rsync -avzP --include='*/' --include='*.jpg' --include='*.jpeg' --include='*.png' --exclude='*' root@164.92.193.78:/root/americas-images/ ./

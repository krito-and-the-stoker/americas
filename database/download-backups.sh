#!/bin/bash

mkdir -p backups/server
rsync -av --ignore-existing root@164.92.193.78:/root/volume/database/backups/* ./backups/server/

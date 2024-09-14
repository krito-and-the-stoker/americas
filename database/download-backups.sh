#!/bin/bash

mkdir -p backups/server
rsync -avzP root@164.92.193.78:/root/volume/database/backups/* ./backups/server/

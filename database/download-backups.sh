#!/bin/bash

mkdir -p backups/server
rsync -avzP --ignore-existing root@164.92.193.78:/root/volume/database/backups/* ./backups/server/

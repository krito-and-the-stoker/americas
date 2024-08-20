#!/bin/bash
# export-db.sh
# usage: docker exec dictionary-backup-1 export.sh

# Set the parameters
MONGO_HOST="database"  # Name of your MongoDB service in docker-compose
MONGO_PORT="27017"
MONGO_USER=${MONGO_INITDB_ROOT_USERNAME:-root}  # Use environment variable if set, otherwise default to 'root'
MONGO_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-example}  # Use environment variable if set, otherwise default to 'example'
MONGO_DB="americas"
BACKUP_NAME="/backups/export_$(date +%Y-%m-%d).gz"

echo "Creating backup..."

# Run mongodump
mongodump --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASSWORD --authenticationDatabase admin --db $MONGO_DB --archive=$BACKUP_NAME --gzip

echo "Backup created: $BACKUP_NAME"

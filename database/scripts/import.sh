#!/bin/bash
# import-db.sh
# usage: docker exec dictionary-backup-1 import.sh backup-file.gz

# Parameters
MONGO_HOST="database"  # Name of your MongoDB service in docker-compose
MONGO_PORT="27017"
MONGO_USER=${MONGO_INITDB_ROOT_USERNAME:-root}  # Use environment variable if set, otherwise default to 'root'
MONGO_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-example}  # Use environment variable if set, otherwise default to 'example'
DATABASE_NAME="americas"  # Name of the database to drop and restore

# Check if backup file name is provided
if [ -z "$1" ]; then
    echo "Error: Backup file name is required."
    exit 1
fi

BACKUP_NAME="/backups/$1"  # Pass the backup file name as an argument

# Drop the database
echo "Dropping database: $DATABASE_NAME"
mongosh --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASSWORD --authenticationDatabase admin --eval "db.getSiblingDB('$DATABASE_NAME').dropDatabase()"

# Check if the drop was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to drop the database $DATABASE_NAME."
    exit 1
fi

echo "Database $DATABASE_NAME dropped successfully."

# Run mongorestore
mongorestore --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASSWORD --authenticationDatabase admin --archive=$BACKUP_NAME --gzip  --nsExclude 'admin.*'

echo "Database restored from backup: $BACKUP_NAME"

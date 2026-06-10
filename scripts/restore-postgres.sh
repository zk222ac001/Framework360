#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

if [ $# -ne 1 ]; then
  echo "Usage: restore-postgres.sh <backup-file.sql>"
  exit 1
fi

BACKUP_FILE="$1"

psql "$DATABASE_URL" < "$BACKUP_FILE"

echo "Restore completed from $BACKUP_FILE"

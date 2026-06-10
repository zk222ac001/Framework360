#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="$BACKUP_DIR/framework360-$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" > "$OUTPUT_FILE"

echo "Backup created: $OUTPUT_FILE"

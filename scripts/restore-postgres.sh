#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 backup_2026-06-01_12-00-00.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

: "${S3_ENDPOINT:?S3_ENDPOINT is required}"
: "${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID is required}"
: "${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${BACKUP_PREFIX:=backups/postgres}"

echo ""
echo "==============================================="
echo "  RESTORATION BASE DE DONNEES PostgreSQL"
echo "==============================================="
echo ""
echo "  ATTENTION : cette operation peut ecraser ou"
echo "  modifier la base existante."
echo "  Ne jamais executer sur production sans backup"
echo "  recent valide."
echo ""
echo "  Backup : $BACKUP_FILE"
echo "  Bucket  : s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/"
echo ""
echo "==============================================="
echo ""

read -r -p "Confirmer la restauration ? taper RESTORE pour continuer : " CONFIRMATION
if [ "$CONFIRMATION" != "RESTORE" ]; then
  echo "Restauration annulee."
  exit 0
fi

S3_PATH="s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Downloading backup from R2..."
aws s3 cp "$S3_PATH" "$BACKUP_FILE" \
  --endpoint-url "$S3_ENDPOINT"

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Restoring database..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

rm "$BACKUP_FILE"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Restore complete."
echo ""
echo "Verifier avec:"
echo "  npm run prisma:migrate status"
echo "  curl http://localhost:4000/health"
echo "  curl http://localhost:4000/ready"
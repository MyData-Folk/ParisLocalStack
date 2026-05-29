#!/bin/bash
set -euo pipefail

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Starting PostgreSQL backup..."

: "${S3_ENDPOINT:?S3_ENDPOINT is required}"
: "${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID is required}"
: "${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${BACKUP_PREFIX:=backups/postgres}"
: "${BACKUP_RETENTION_DAYS:=7}"

TIMESTAMP=$(date -u '+%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Dumping database..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Dump complete: $BACKUP_FILE"

S3_PATH="s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Uploading to R2..."
aws s3 cp "$BACKUP_FILE" "$S3_PATH" \
  --endpoint-url "$S3_ENDPOINT"

rm "$BACKUP_FILE"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Backup uploaded: $S3_PATH"

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Cleaning backups older than ${BACKUP_RETENTION_DAYS} days..."
CUTOFF_DATE=$(date -u -d "-${BACKUP_RETENTION_DAYS} days" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -v-${BACKUP_RETENTION_DAYS}d '+%Y-%m-%dT%H:%M:%SZ')

aws s3 ls "s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/" \
  --endpoint-url "$S3_ENDPOINT" \
  2>/dev/null \
| awk '{print $4}' \
| while IFS= read -r KEY; do
  LAST_MODIFIED=$(aws s3api head-object \
    --bucket "$BACKUP_S3_BUCKET" \
    --key "$BACKUP_PREFIX/$KEY" \
    --endpoint-url "$S3_ENDPOINT" \
    --query 'LastModified' \
    --output text 2>/dev/null || echo "")

  if [ -n "$LAST_MODIFIED" ] && [[ "$LAST_MODIFIED" < "$CUTOFF_DATE" ]]; then
    echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Deleting: $KEY (last modified: $LAST_MODIFIED)"
    aws s3 rm "s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/${KEY}" \
      --endpoint-url "$S3_ENDPOINT"
  fi
done

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Backup complete."
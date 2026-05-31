#!/bin/bash
set -euo pipefail

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Starting PostgreSQL backup..."

BACKUP_HEALTHCHECK_URL="${BACKUP_HEALTHCHECK_URL:-}"

_hc_ping() {
  local suffix="${1:-}"

  if [ -z "$BACKUP_HEALTHCHECK_URL" ]; then
    return 0
  fi

  wget -qO- "${BACKUP_HEALTHCHECK_URL}${suffix}" >/dev/null 2>&1 || true
}

cleanup() {
  rm -f "${BACKUP_FILE:-}" 2>/dev/null
}

on_error() {
  _hc_ping "/fail"
}

trap cleanup EXIT
trap on_error ERR

: "${S3_ENDPOINT:?S3_ENDPOINT is required}"
: "${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID is required}"
: "${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY is required}"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-$S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-$S3_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-${S3_REGION:-auto}}"

BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-$S3_BUCKET}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET or S3_BUCKET is required}"
BACKUP_PREFIX="${BACKUP_PREFIX:-backups/postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

TIMESTAMP=$(date -u '+%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

_hc_ping "/start"

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Dumping database..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Dump complete: $BACKUP_FILE"

S3_PATH="s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Uploading to R2..."
aws s3 cp "$BACKUP_FILE" "$S3_PATH" \
  --endpoint-url "$S3_ENDPOINT"

rm "$BACKUP_FILE"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Backup uploaded: $S3_PATH"

if [ "${BACKUP_RETENTION_DAYS}" -eq 0 ]; then
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Retention disabled (BACKUP_RETENTION_DAYS=0). Skipping cleanup."
else

  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Cleaning backups older than ${BACKUP_RETENTION_DAYS} days..."
  CUTOFF_DATE=$(node -e "
    const d = new Date(Date.now() - ${BACKUP_RETENTION_DAYS} * 86400 * 1000);
    console.log(d.toISOString());
  ")

  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Cutoff date: $CUTOFF_DATE"

  aws s3 ls "s3://${BACKUP_S3_BUCKET}/${BACKUP_PREFIX}/" \
    --endpoint-url "$S3_ENDPOINT" \
    2>/dev/null \
  | awk '{print $4}' \
  | while IFS= read -r KEY; do
    if [ -z "$KEY" ]; then continue; fi
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
fi

echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Backup complete."
_hc_ping ""

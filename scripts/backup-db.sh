#!/bin/bash
# ============================================================
# Backup PostgreSQL database to JSON files
# ============================================================
# Usage: ./scripts/backup-db.sh [output_dir]
# Default output: ./backup/

set -e

CONTAINER="pq-postgres"
DB_USER="pq_user"
DB_NAME="pq_jobs"
OUTPUT_DIR="${1:-./backup}"

# Tables to backup (in order for foreign key constraints)
TABLES=(
  "address_province"
  "address_district"
  "address_ward"
  "job_category"
  "blog_category"
  "resume_template"
  "user"
  "account"
  "session"
  "verification"
  "jwks"
  "company"
  "job"
  "candidate_resume"
  "job_application"
  "notification"
  "saved_job"
  "saved_company"
  "blog_post"
  "pricing_package"
  "payment"
  "audit_log"
)

echo "=== Backup Database ==="
echo "Container: $CONTAINER"
echo "Database: $DB_NAME"
echo "Output: $OUTPUT_DIR"
echo ""

mkdir -p "$OUTPUT_DIR"

for table in "${TABLES[@]}"; do
  echo -n "  Exporting $table... "
  
  # Export table to JSON via psql
  docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (SELECT * FROM \"$table\") t;" \
    > "$OUTPUT_DIR/${table}.json" 2>/dev/null
  
  # Count records
  count=$(python3 -c "import json; print(len(json.load(open('$OUTPUT_DIR/${table}.json'))))" 2>/dev/null || echo "?")
  echo "$count records"
done

echo ""
echo "=== Backup Complete ==="
echo "Files saved to: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"/*.json | awk '{print "  " $9 " (" $5 ")"}'

#!/bin/bash

# Deploy all migrations to Supabase
# Usage: ./deploy-migrations.sh

set -e

SUPABASE_URL="https://berubgvunuldigjqpcju.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcnViZ3Z1bnVsZGlnanFwY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMDYxNywiZXhwIjoyMDkwMjA2NjE3fQ.wecxul1cFggOTbcxGRRBxw7gIuJpVNuQAn9_VTaJnHg"

# Database connection string
DB_URL="postgresql://postgres.berubgvunuldigjqpcju:$1@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "🚀 Deploying ClearTalk database migrations..."
echo ""

# Run each migration in order
for file in migrations/*.sql; do
    echo "📄 Running $(basename $file)..."
    psql "$DB_URL" -f "$file" 2>&1 | grep -v "NOTICE"
    if [ $? -eq 0 ]; then
        echo "✅ $(basename $file) completed"
    else
        echo "❌ $(basename $file) failed"
        exit 1
    fi
    echo ""
done

echo ""
echo "🎉 All migrations deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Run seed data: psql \"$DB_URL\" -f seed.sql"
echo "2. Verify schema: psql \"$DB_URL\" -f verify-schema.sql"

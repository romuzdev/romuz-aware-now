#!/bin/bash

# ============================================================================
# Romuz Awareness GRC - Quick Restore Script
# ============================================================================
# This script automates the restoration process
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="xovzmzokmpemvxcpzmuh"
SUPABASE_URL="https://xovzmzokmpemvxcpzmuh.supabase.co"
DB_HOST="db.xovzmzokmpemvxcpzmuh.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Romuz Awareness GRC - Quick Restore Script  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed${NC}"
    echo "Please install PostgreSQL client tools first"
    exit 1
fi

echo -e "${YELLOW}📋 Prerequisites Check:${NC}"
echo "  ✅ psql installed"
echo ""

# Ask for database password
echo -e "${YELLOW}🔐 Please enter your Supabase database password:${NC}"
read -s DB_PASSWORD
echo ""

# Test connection
echo -e "${YELLOW}🔌 Testing database connection...${NC}"
export PGPASSWORD="$DB_PASSWORD"
if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check your credentials.${NC}"
    exit 1
fi
echo ""

# Step 1: Apply schema migrations
echo -e "${YELLOW}📦 Step 1/3: Applying schema migrations...${NC}"
echo "This may take 10-15 minutes..."
if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f migrations-combined.sql > migration.log 2>&1; then
    echo -e "${GREEN}✅ Schema migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Schema migration failed. Check migration.log for details.${NC}"
    exit 1
fi
echo ""

# Step 2: Import data
echo -e "${YELLOW}📊 Step 2/3: Importing data...${NC}"
if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f data-export.sql > data.log 2>&1; then
    echo -e "${GREEN}✅ Data imported successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Data import had warnings. Check data.log for details.${NC}"
fi
echo ""

# Step 3: Verify installation
echo -e "${YELLOW}🔍 Step 3/3: Verifying installation...${NC}"

# Count tables
TABLE_COUNT=$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('public', 'gate_h', 'gate_i', 'gate_j', 'gate_l');")
echo "  Tables created: $TABLE_COUNT"

# Count tenants
TENANT_COUNT=$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -t -c "SELECT COUNT(*) FROM public.tenants;")
echo "  Tenants imported: $TENANT_COUNT"

# Check RLS
RLS_COUNT=$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;")
echo "  Tables with RLS: $RLS_COUNT"

echo ""

if [ $TABLE_COUNT -gt 20 ] && [ $TENANT_COUNT -gt 0 ] && [ $RLS_COUNT -gt 10 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Restoration completed successfully! ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "  1. Go to Supabase Auth Dashboard"
    echo "  2. Create users manually"
    echo "  3. Update .env file with new credentials"
    echo "  4. Test application login"
    echo ""
    echo -e "${YELLOW}📄 Log files:${NC}"
    echo "  - migration.log (schema migration logs)"
    echo "  - data.log (data import logs)"
else
    echo -e "${RED}⚠️  Restoration completed with warnings${NC}"
    echo "Please check the log files for details"
fi

# Cleanup
unset PGPASSWORD

echo ""
echo -e "${GREEN}Done!${NC}"

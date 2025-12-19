#!/bin/bash

# SLA Module - Verification Script
# This script verifies that the SLA module is properly installed and working

echo "🔍 SLA Module Verification"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Files exist
echo "1️⃣  Checking files exist..."
files_to_check=(
  "src/migrations/048_create_sla_tables.sql"
  "src/models/sla.model.ts"
  "src/repositories/sla.repository.ts"
  "src/services/sla.service.ts"
  "src/controllers/sla.controller.ts"
  "src/routes/sla.routes.ts"
  "scripts/run_migration_048.js"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file"
    all_files_exist=false
  fi
done

echo ""

# Check 2: TypeScript compilation
echo "2️⃣  Checking TypeScript compilation..."
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo -e "${RED}❌${NC} TypeScript compilation failed"
  npx tsc --noEmit
else
  echo -e "${GREEN}✅${NC} TypeScript compiles without errors"
fi

echo ""

# Check 3: Routes imported in server
echo "3️⃣  Checking server configuration..."
if grep -q "sla.routes" src/server/index.ts; then
  echo -e "${GREEN}✅${NC} SLA routes imported in server"
else
  echo -e "${RED}❌${NC} SLA routes not imported in server"
fi

if grep -q '"/api/sla"' src/server/index.ts; then
  echo -e "${GREEN}✅${NC} SLA routes mounted at /api/sla"
else
  echo -e "${RED}❌${NC} SLA routes not mounted"
fi

echo ""

# Check 4: Documentation exists
echo "4️⃣  Checking documentation..."
docs=(
  "docs/SLA_API_DOCUMENTATION.md"
  "docs/SLA_EXAMPLE_PAYLOADS.md"
  "docs/SLA_IMPLEMENTATION_SUMMARY.md"
  "docs/SLA_QUICK_REFERENCE.md"
  "SLA_IMPLEMENTATION_READY.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✅${NC} $doc"
  else
    echo -e "${YELLOW}⚠️${NC}  $doc (missing)"
  fi
done

echo ""

# Check 5: Database connection
echo "5️⃣  Checking database..."
if [ -z "$DATABASE_URL" ]; then
  # Try to read from .env
  if [ -f ".env" ]; then
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
  fi
fi

if [ -n "$DATABASE_URL" ]; then
  echo -e "${GREEN}✅${NC} DATABASE_URL configured"
else
  echo -e "${YELLOW}⚠️${NC}  DATABASE_URL not found in environment"
fi

echo ""

# Check 6: Migration status
echo "6️⃣  Checking migration status..."
if [ -f "scripts/run_migration_048.js" ]; then
  echo -e "${GREEN}✅${NC} Migration script exists"
  echo -e "${YELLOW}ℹ️${NC}  Run with: node scripts/run_migration_048.js"
else
  echo -e "${RED}❌${NC} Migration script not found"
fi

echo ""

# Summary
echo "============================"
echo "📋 Summary"
echo "============================"

if [ "$all_files_exist" = true ]; then
  echo -e "${GREEN}✅${NC} All required files present"
else
  echo -e "${RED}❌${NC} Some files missing"
fi

echo ""
echo "📚 Documentation:"
echo "  - Full API: docs/SLA_API_DOCUMENTATION.md"
echo "  - Examples: docs/SLA_EXAMPLE_PAYLOADS.md"
echo "  - Overview: docs/SLA_IMPLEMENTATION_SUMMARY.md"
echo "  - Quick Ref: docs/SLA_QUICK_REFERENCE.md"
echo ""

echo "🚀 Next steps:"
echo "  1. Run migration: node scripts/run_migration_048.js"
echo "  2. Start server: npm run dev"
echo "  3. Test: curl http://localhost:4000/api/sla/configuracion/1"
echo ""

echo -e "${GREEN}✅ SLA Module verification complete${NC}"

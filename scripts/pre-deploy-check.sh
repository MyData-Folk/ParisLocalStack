#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

echo "🔍 Paris Local — Pre-deploy check"
echo "=================================="

# Git status clean
git diff --quiet && git diff --staged --quiet
check $? "Git working tree is clean"

# Variables obligatoires dans .env
[ -f .env ] || { echo -e "${RED}❌ .env file not found${NC}"; exit 1; }
grep -q "^JWT_SECRET=" .env && grep -q "^DATABASE_URL=" .env && grep -q "^CORS_ORIGIN=" .env
check $? "Required env variables present (.env)"

# JWT_SECRET longueur minimum
JWT_LEN=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | tr -d '\n' | wc -c)
[ "$JWT_LEN" -ge 32 ]
check $? "JWT_SECRET is at least 32 characters (found: ${JWT_LEN})"

# Typecheck API
npm run typecheck --workspace @paris-local/api > /dev/null 2>&1
check $? "TypeScript API (0 errors)"

# Typecheck Web
npm run typecheck --workspace @paris-local/web > /dev/null 2>&1
check $? "TypeScript Web (0 errors)"

# Build API
npm run build --workspace @paris-local/api > /dev/null 2>&1
check $? "Build API successful"

# Build Web
npm run build --workspace @paris-local/web > /dev/null 2>&1
check $? "Build Web successful"

echo "=================================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les checks passent — Prêt pour le déploiement${NC}"
  exit 0
else
  echo -e "${RED}❌ ${ERRORS} check(s) échoué(s) — Ne pas déployer${NC}"
  exit 1
fi

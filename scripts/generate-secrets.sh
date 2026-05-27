#!/bin/sh

# Generate secure secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
SEED_ADMIN_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

echo "========================================================================"
echo "🔑 SECURE SECRETS GENERATOR FOR PARIS LOCAL / DIGITAL HOTEL CONCIERGE"
echo "========================================================================"
echo ""
echo "Here is your newly generated JWT_SECRET (96 characters, highly secure):"
echo "👉 $JWT_SECRET"
echo ""
echo "Here is your newly generated SEED_ADMIN_PASSWORD:"
echo "👉 $SEED_ADMIN_PASSWORD"
echo ""
echo "------------------------------------------------------------------------"
echo "📋 STEPS TO CONFIGURE IN COOLIFY PRODUCTION:"
echo "------------------------------------------------------------------------"
echo "1. Go to your Coolify dashboard."
echo "2. Open the 'ParisLocalStack' project."
echo "3. Select the 'paris-local-api' application service."
echo "4. Go to 'Environment Variables'."
echo "5. Add or update the following variables:"
echo "   - JWT_SECRET = $JWT_SECRET"
echo "   - SEED_ADMIN_PASSWORD = $SEED_ADMIN_PASSWORD"
echo "6. Save and redeploy the service."
echo ""
echo "⚠️  IMPORTANT: Do NOT commit these values to Git! Always use environment variables."
echo "========================================================================"

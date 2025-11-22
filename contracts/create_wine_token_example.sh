#!/bin/bash

# Example: Create a wine token using the simple wine factory
# This script shows how to tokenize a wine lot

set -e

# Load deployed contract IDs
if [ -f ".deployed_wine_token_testnet.env" ]; then
    source .deployed_wine_token_testnet.env
else
    echo "❌ Deployment config not found. Run ./deploy_wine_token.sh first"
    exit 1
fi

echo "🍷 Creating Wine Token Example"
echo "================================"
echo "Factory ID: $WINE_FACTORY_ID"
echo "Admin: $ADMIN_ADDRESS"
echo ""

# Create the wine token
echo "Creating Malbec Reserve 2024 token..."
echo ""

TOKEN_ADDRESS=$(stellar contract invoke \
  --id "$WINE_FACTORY_ID" \
  --source-account "$ACCOUNT_NAME" \
  --network "$NETWORK" \
  -- create_wine_token \
  --admin "$ADMIN_ADDRESS" \
  --decimal 0 \
  --name "Malbec Reserve 2024" \
  --symbol "MAL24" \
  --wine_lot_metadata "{\"lot_id\": \"MAL-2024-001\", \"winery_name\": \"Bodega Catena Zapata\", \"region\": \"Mendoza\", \"country\": \"Argentina\", \"vintage\": 2024, \"varietal\": \"Malbec\", \"bottle_count\": 1000, \"description\": \"Premium Estate Reserve\", \"token_code\": \"MAL24\"}" 2>&1 | grep -oE 'C[A-Z0-9]{55}' | head -1)

echo ""
echo "✅ Wine token created!"
echo "Token Address: $TOKEN_ADDRESS"
echo ""

# Save token address
echo "TOKEN_ADDRESS=$TOKEN_ADDRESS" >> .deployed_wine_token_testnet.env

# Query wine metadata
echo "📋 Querying wine metadata..."
echo ""

stellar contract invoke \
  --id "$TOKEN_ADDRESS" \
  --source-account "$ACCOUNT_NAME" \
  --network "$NETWORK" \
  -- get_wine_lot_metadata

echo ""
echo "🎉 Done! Your wine lot is now tokenized."
echo ""
echo "Next steps:"
echo "  1. Mint tokens to distribute to buyers"
echo "  2. Transfer tokens to represent ownership"
echo "  3. Query wine metadata anytime"
echo ""
echo "Example commands:"
echo ""
echo "# Mint 100 tokens to a buyer"
echo "stellar contract invoke \\"
echo "  --id $TOKEN_ADDRESS \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network $NETWORK \\"
echo "  -- mint \\"
echo "  --to <BUYER_ADDRESS> \\"
echo "  --amount 100"
echo ""
echo "# Check balance"
echo "stellar contract invoke \\"
echo "  --id $TOKEN_ADDRESS \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network $NETWORK \\"
echo "  -- balance \\"
echo "  --id <ADDRESS>"
echo ""



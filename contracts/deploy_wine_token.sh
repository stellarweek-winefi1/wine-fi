#!/bin/bash

# Simple Wine Token Deployment Script
# This deploys the simplified wine tokenization system
# Usage: ./deploy_wine_token.sh [network] [account]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🍷 Simple Wine Token Deployment${NC}"
echo "========================================"
echo ""

# Configuration
NETWORK="${1:-testnet}"
ACCOUNT_NAME="${2:-winefi-admin}"

echo "Network: $NETWORK"
echo "Account: $ACCOUNT_NAME"
echo ""

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}❌ Stellar CLI not installed${NC}"
    echo "Install with: cargo install --locked stellar-cli"
    exit 1
fi

# Check if account exists
if ! stellar keys address "$ACCOUNT_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Account '$ACCOUNT_NAME' does not exist${NC}"
    echo "Creating account..."
    stellar keys generate "$ACCOUNT_NAME"
    echo ""
fi

# Fund account on testnet
if [ "$NETWORK" = "testnet" ]; then
    echo "💰 Funding account on testnet..."
    ACCOUNT_ADDRESS=$(stellar keys address "$ACCOUNT_NAME")
    echo "Account address: $ACCOUNT_ADDRESS"
    
    if stellar keys fund "$ACCOUNT_NAME" --network testnet 2>&1 | grep -q "funded"; then
        echo -e "${GREEN}✓ Account funded successfully${NC}"
    else
        echo "Trying friendbot..."
        FUND_RESPONSE=$(curl -s "https://friendbot.stellar.org/?addr=$ACCOUNT_ADDRESS")
        
        if echo "$FUND_RESPONSE" | grep -q "hash\|Account already exists"; then
            echo -e "${GREEN}✓ Account funded${NC}"
        else
            echo -e "${RED}❌ Failed to fund account${NC}"
            echo "Fund manually at: https://laboratory.stellar.org/#account-creator?network=testnet"
            read -p "Press Enter after funding..."
        fi
    fi
    echo ""
fi

# Configure network
case "$NETWORK" in
    testnet)
        export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
        export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
        ;;
    futurenet)
        export STELLAR_RPC_URL=https://rpc-futurenet.stellar.org
        export STELLAR_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
        ;;
    mainnet)
        export STELLAR_RPC_URL=https://soroban-rpc.mainnet.stellar.org
        export STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
        ;;
    *)
        echo -e "${RED}❌ Unknown network: $NETWORK${NC}"
        exit 1
        ;;
esac

export STELLAR_NETWORK="$NETWORK"
stellar keys use "$ACCOUNT_NAME"

ADMIN_ADDRESS=$(stellar keys address "$ACCOUNT_NAME")
echo -e "${GREEN}✓ Admin Address: $ADMIN_ADDRESS${NC}"
echo ""

# Build contracts
echo "📦 Building wine token contracts..."
cargo build --target wasm32v1-none --release -p wine-token -p wine-factory

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contracts built${NC}"
echo ""

# Step 1: Upload Wine Token WASM
echo "🚀 Step 1: Uploading Wine Token WASM..."
TOKEN_WASM_HASH=$(stellar contract upload \
  --wasm target/wasm32v1-none/release/wine_token.wasm \
  --source-account "$ACCOUNT_NAME" \
  --network "$NETWORK" 2>&1 | tee /dev/tty | grep -oE '[a-f0-9]{64}' | head -1)

if [ -z "$TOKEN_WASM_HASH" ]; then
    echo -e "${RED}❌ Failed to get Token WASM hash${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token WASM Hash: $TOKEN_WASM_HASH${NC}"
echo ""

# Step 2: Deploy Wine Factory
echo "🚀 Step 2: Deploying Wine Factory Contract..."
FACTORY_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/wine_factory.wasm \
  --network "$NETWORK" \
  -- \
  --admin "$ADMIN_ADDRESS" \
  --token_wasm_hash "$TOKEN_WASM_HASH" 2>&1 | tee /dev/tty | grep -oE 'C[A-Z0-9]{55}' | head -1)

if [ -z "$FACTORY_ID" ]; then
    echo -e "${RED}❌ Failed to deploy Factory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Factory Contract ID: $FACTORY_ID${NC}"
echo ""

# Save configuration
CONFIG_FILE=".deployed_wine_token_${NETWORK}.env"
cat > "$CONFIG_FILE" << EOF
# Simple Wine Token System deployed on $NETWORK
# Generated on $(date)

WINE_FACTORY_ID=$FACTORY_ID
TOKEN_WASM_HASH=$TOKEN_WASM_HASH

# Network configuration
NETWORK=$NETWORK
ACCOUNT_NAME=$ACCOUNT_NAME
ADMIN_ADDRESS=$ADMIN_ADDRESS
EOF

echo -e "${GREEN}✓ Configuration saved to: $CONFIG_FILE${NC}"
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "📋 Contract IDs:"
echo "  Wine Factory:    $FACTORY_ID"
echo "  Token WASM Hash: $TOKEN_WASM_HASH"
echo ""
echo "🧪 Test the deployment:"
echo ""
echo "# Check factory admin:"
echo "stellar contract invoke \\"
echo "  --id $FACTORY_ID \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network $NETWORK \\"
echo "  -- admin"
echo ""
echo "# Create a wine token:"
echo "stellar contract invoke \\"
echo "  --id $FACTORY_ID \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network $NETWORK \\"
echo "  -- create_wine_token \\"
echo "  --admin $ADMIN_ADDRESS \\"
echo "  --decimal 0 \\"
echo "  --name \"Malbec Reserve 2024\" \\"
echo "  --symbol \"MAL24\" \\"
echo "  --wine_lot_metadata '{\"lot_id\": \"MAL-2024-001\", \"winery_name\": \"Bodega Catena\", \"region\": \"Mendoza\", \"country\": \"Argentina\", \"vintage\": 2024, \"varietal\": \"Malbec\", \"bottle_count\": 1000, \"description\": \"Premium Reserve\", \"token_code\": \"MAL24\"}'"
echo ""



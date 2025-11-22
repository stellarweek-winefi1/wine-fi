# WineFi - Simple Wine Token Contracts

Soroban smart contracts for tokenizing wine lots on Stellar blockchain.

## 🎯 What This Does

Create simple, tradeable tokens that represent wine lots with embedded metadata (winery, vintage, region, etc.).

## 📁 Structure

```
contracts/
├── wine_token/          # Simple wine token with metadata
├── wine_factory/        # Factory for deploying wine tokens
├── common/              # Shared data models
├── deploy_wine_token.sh # Deployment script
└── create_wine_token_example.sh # Usage example
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install Stellar CLI
cargo install --locked stellar-cli

# Install Rust WASM target
rustup target add wasm32-unknown-unknown
```

### Deploy to Testnet

```bash
cd contracts

# Deploy factory and upload token WASM
./deploy_wine_token.sh testnet winefi-admin

# Load configuration
source .deployed_wine_token_testnet.env
```

### Create Your First Wine Token

```bash
# Use the example script
./create_wine_token_example.sh

# Or manually
stellar contract invoke \
  --id $WINE_FACTORY_ID \
  --source-account winefi-admin \
  --network testnet \
  -- create_wine_token \
  --admin $(stellar keys address winefi-admin) \
  --decimal 0 \
  --name "Malbec Reserve 2024" \
  --symbol "MAL24" \
  --wine_lot_metadata '{
    "lot_id": "MAL-2024-001",
    "winery_name": "Bodega Catena",
    "region": "Mendoza",
    "country": "Argentina",
    "vintage": 2024,
    "varietal": "Malbec",
    "bottle_count": 1000,
    "description": "Premium Reserve",
    "token_code": "MAL24"
  }'
```

## 📖 Wine Token Features

- ✅ **Wine Metadata**: Embedded winery, region, vintage, varietal, bottle count
- ✅ **Mint Tokens**: Winery can mint tokens (admin only)
- ✅ **Transfer**: Standard token transfers between wallets
- ✅ **Burn**: Remove tokens from circulation
- ✅ **Query Metadata**: Anyone can read wine information

## 🔧 Common Commands

### Mint Tokens

```bash
# Mint 100 tokens to a buyer
stellar contract invoke \
  --id <TOKEN_ADDRESS> \
  --source-account winefi-admin \
  --network testnet \
  -- mint \
  --to <BUYER_ADDRESS> \
  --amount 100
```

### Check Balance

```bash
stellar contract invoke \
  --id <TOKEN_ADDRESS> \
  --source-account winefi-admin \
  --network testnet \
  -- balance \
  --id <ADDRESS>
```

### Query Wine Metadata

```bash
stellar contract invoke \
  --id <TOKEN_ADDRESS> \
  --source-account winefi-admin \
  --network testnet \
  -- get_wine_lot_metadata
```

### Transfer Tokens

```bash
stellar contract invoke \
  --id <TOKEN_ADDRESS> \
  --source-account buyer-account \
  --network testnet \
  -- transfer \
  --from $(stellar keys address buyer-account) \
  --to <RECIPIENT_ADDRESS> \
  --amount 10
```

## 📊 Wine Metadata Structure

```rust
struct WineLotMetadata {
    lot_id: String,          // Unique lot identifier
    winery_name: String,     // Name of the winery
    region: String,          // Wine region
    country: String,         // Country
    vintage: u32,            // Year
    varietal: String,        // Grape variety
    bottle_count: u32,       // Number of bottles in lot
    description: Option<String>,  // Optional description
    token_code: String,      // Short code
}
```

## 🔨 Development

```bash
# Build contracts
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test

# Build specific contract
cargo build -p wine-token --target wasm32-unknown-unknown --release
```

## 🌐 Networks

### Testnet (Default)
- RPC: https://soroban-testnet.stellar.org
- Passphrase: "Test SDF Network ; September 2015"
- Get free XLM: https://laboratory.stellar.org/#account-creator?network=testnet

### Futurenet
```bash
./deploy_wine_token.sh futurenet your-account
```

### Mainnet
```bash
./deploy_wine_token.sh mainnet your-account
```

## 📝 Deployed Contracts

After deployment, contract IDs are saved in `.deployed_wine_token_testnet.env`:

```env
WINE_FACTORY_ID=C...
TOKEN_WASM_HASH=...
NETWORK=testnet
ACCOUNT_NAME=winefi-admin
ADMIN_ADDRESS=G...
```

## 🛠️ Troubleshooting

### Account Not Funded
```bash
stellar keys fund your-account --network testnet
```

### WASM Hash Mismatch
Re-upload the token WASM:
```bash
stellar contract upload \
  --wasm target/wasm32-unknown-unknown/release/wine_token.wasm \
  --source-account your-account \
  --network testnet
```

Then update the factory:
```bash
stellar contract invoke \
  --id $WINE_FACTORY_ID \
  --source-account your-account \
  --network testnet \
  -- set_token_wasm_hash \
  --new_token_wasm_hash <NEW_HASH>
```

## 📚 Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Explorer](https://stellar.expert/)

## 🤝 Integration

These contracts integrate with:
- **Supabase Edge Functions**: Custodial wallet management
- **Next.js Frontend**: User interface for token operations
- **Database**: Track token holdings and transactions

See `supabase/functions/` for backend integration examples.

## ⚖️ License

MIT License - VineFi Team

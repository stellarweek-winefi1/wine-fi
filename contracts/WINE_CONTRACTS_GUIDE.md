# 🍷 WineFi Contracts Guide

This repository contains **two different approaches** for wine tokenization on Stellar/Soroban:

## 📊 Quick Comparison

| Feature | Simple Wine Token | Complex Vault System |
|---------|------------------|----------------------|
| **Purpose** | Tokenize wine lots | Tokenized wine investment funds |
| **Complexity** | ⭐ Simple | ⭐⭐⭐⭐⭐ Complex |
| **Use Case** | Wine ownership tracking | DeFi wine investments |
| **Dependencies** | None | Soroswap, Strategies |
| **Contracts** | 2 (Factory + Token) | 3 (Factory + Vault + Common) |
| **Deployment** | `./deploy_wine_token.sh` | `./deploy_winefi.sh` |

---

## 🎯 Option 1: Simple Wine Token (RECOMMENDED FOR WINE TRACKING)

### What It Does
- **Factory creates simple tokens** with wine metadata
- Each token represents a wine lot (e.g., 1000 bottles of Malbec 2024)
- Winery mints tokens and distributes to buyers
- Simple transfers, no DeFi features

### Structure
```
wine_factory/          # Deploys wine tokens
wine_token/            # Simple token with wine metadata
common/                # Shared models
```

### Wine Token Features
- ✅ Wine metadata (winery, region, vintage, varietal, bottle count)
- ✅ Mint tokens (winery only)
- ✅ Transfer tokens
- ✅ Burn tokens
- ✅ Query wine information
- ❌ No DeFi features
- ❌ No strategies or investments

### Deployment

```bash
# Build and deploy
./deploy_wine_token.sh testnet winefi-admin

# Load configuration
source .deployed_wine_token_testnet.env

# Create a wine token
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

### Use Cases
- ✅ Wine lot tokenization
- ✅ Ownership tracking
- ✅ Simple marketplace integration
- ✅ Proof of authenticity
- ✅ Fractional wine ownership

---

## 🏦 Option 2: Complex Vault System (FOR DEFI WINE INVESTMENTS)

### What It Does
- **Factory creates investment vaults** with optional wine metadata
- Vaults manage multi-asset investment strategies
- Integrated with Soroswap DEX for token swaps
- Complex yield strategies and rebalancing
- Vault issues tokens (shares) to investors

### Structure
```
factory/               # Deploys vaults
vault/                 # Complex DeFi vault with strategies
  ├── token/          # Built-in token module
  ├── strategies/     # Investment strategies
  ├── router/         # Soroswap integration
  └── ...
common/                # Shared models
```

### Vault Features
- ✅ Multi-asset investment strategies
- ✅ Soroswap DEX integration
- ✅ Rebalancing
- ✅ Fee management
- ✅ Yield optimization
- ✅ Wine metadata (optional)
- ⚠️ Very complex
- ⚠️ Requires Soroswap router address
- ⚠️ Requires strategy contracts

### Deployment

```bash
# Build and deploy
./deploy_winefi.sh testnet winefi-admin

# Load configuration
source .deployed_winefi_testnet.env

# Create a vault (complex - requires many parameters)
# See create_wine_vault_example.sh
```

### Use Cases
- ✅ Tokenized wine investment funds
- ✅ DeFi yield strategies
- ✅ Multi-asset wine portfolios
- ✅ Automated rebalancing
- ❌ NOT for simple wine tracking

---

## 🤔 Which One Should You Use?

### Use **Simple Wine Token** if you want to:
- ✅ Tokenize wine lots
- ✅ Track wine ownership
- ✅ Build a simple wine marketplace
- ✅ Verify authenticity
- ✅ Enable fractional ownership
- ✅ **Keep it simple**

### Use **Complex Vault System** if you want to:
- 🏦 Build a wine investment platform
- 📈 Implement yield strategies
- 💱 Integrate with DEXs
- 🔄 Auto-rebalance portfolios
- ⚠️ **Ready for complexity**

---

## 📁 Directory Structure

```
contracts/
├── wine_token/                    # ⭐ Simple wine token
├── wine_factory/                  # ⭐ Simple factory
├── vault/                         # 🏦 Complex DeFi vault
├── factory/                       # 🏦 Complex factory
├── common/                        # Shared models
├── deploy_wine_token.sh          # ⭐ Deploy simple system
├── deploy_winefi.sh              # 🏦 Deploy complex system
└── WINE_CONTRACTS_GUIDE.md       # This file
```

---

## 🚀 Quick Start (Simple System)

```bash
# 1. Deploy the simple wine token system
cd contracts
./deploy_wine_token.sh

# 2. Load environment
source .deployed_wine_token_testnet.env

# 3. Create your first wine token
stellar contract invoke \
  --id $WINE_FACTORY_ID \
  --source-account winefi-admin \
  --network testnet \
  -- create_wine_token \
  --admin $(stellar keys address winefi-admin) \
  --decimal 0 \
  --name "My Wine 2024" \
  --symbol "WINE24" \
  --wine_lot_metadata '{
    "lot_id": "WINE-2024-001",
    "winery_name": "My Winery",
    "region": "Napa Valley",
    "country": "USA",
    "vintage": 2024,
    "varietal": "Cabernet Sauvignon",
    "bottle_count": 500,
    "description": "Estate Reserve",
    "token_code": "WINE24"
  }'

# 4. Query token
stellar contract invoke \
  --id <TOKEN_ADDRESS> \
  --source-account winefi-admin \
  --network testnet \
  -- get_wine_lot_metadata
```

---

## 📖 Wine Metadata Structure

Both systems use the same wine metadata structure:

```rust
struct WineLotMetadata {
    lot_id: String,          // Unique lot identifier
    winery_name: String,     // Name of the winery
    region: String,          // Wine region (e.g., "Mendoza")
    country: String,         // Country (e.g., "Argentina")
    vintage: u32,            // Year (e.g., 2024)
    varietal: String,        // Grape variety (e.g., "Malbec")
    bottle_count: u32,       // Number of bottles in lot
    description: Option<String>,  // Optional description
    token_code: String,      // Short code (e.g., "MAL24")
}
```

---

## 🔧 Development

```bash
# Build all contracts
cargo build --target wasm32v1-none --release

# Build only simple system
cargo build --target wasm32v1-none --release -p wine-token -p wine-factory

# Build only complex system
cargo build --target wasm32v1-none --release -p vinifica-vault -p vinifica-factory

# Run tests
cargo test
```

---

## 💡 Recommendation

**For wine tokenization and tracking:** Use the **Simple Wine Token** system (`wine_token` + `wine_factory`).

It's designed specifically for your use case and avoids all the DeFi complexity you don't need.



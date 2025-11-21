# Supabase Edge Functions for Wine Tokenization

This directory contains Supabase Edge Functions that orchestrate the Winefy wine token lifecycle—from preparing a wine lot to distributing token proceeds.

## Functions

1. **prepare-token** – Registers a wine lot, provisions custody wallets, and prepares Stellar trustlines.
2. **status** – Returns the current wine lot lifecycle status plus marketplace metadata.
3. **emission-xdr** – Produces unsigned Stellar XDR for winery-controlled issuance.
4. **submit-signed** – Submits the signed emission transaction and records on-chain hashes.
5. **distribute** – Splits minted supply between winery, platform treasury, and reserve pools.
6. **list-distributed-tokens** – Provides marketplace-ready listings via the `wine_marketplace_view`.

## Setup

### 1. Environment Variables

Set these environment variables in your Supabase project:

```bash
# Supabase (automatically available)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stellar Network Configuration
STELLAR_NETWORK=PUBLIC  # or TESTNET, FUTURENET
HORIZON_URL=https://horizon.stellar.org  # Optional, auto-configured based on STELLAR_NETWORK

# Platform Configuration
PLATFORM_TREASURY_PUBLIC_KEY=GXXXXX...  # Platform treasury public key
PLATFORM_FUNDING_SECRET_KEY=SXXXXX...   # Secret key for funding distribution accounts (optional)
PLATFORM_STORAGE_BUCKET=wine-lots      # Storage bucket for lot paperwork/media
SUPABASE_WINE_STORAGE_URL=https://...  # Base URL exposing stored documentation assets

# Encryption
ENCRYPTION_KEY=your-256-bit-encryption-key  # Must be exactly 32 bytes or will be hashed to 32 bytes
```

### 2. Database Setup

Run the migrations in `supabase/migrations/` to create the wine-specific schema:

- `wine_lots`
- `wine_token_issuances`
- `wine_distributions`
- `wine_marketplace_view`
- `wine_portfolio_view`

### 3. Deploy Functions

```bash
# Deploy all functions
supabase functions deploy prepare-token
supabase functions deploy status
supabase functions deploy emission-xdr
supabase functions deploy submit-signed
supabase functions deploy distribute
supabase functions deploy list-distributed-tokens

# Or deploy all at once (if supported)
supabase functions deploy
```

### 4. Set Environment Variables in Supabase

In your Supabase dashboard:

1. Go to Project Settings > Edge Functions
2. Add the environment variables listed above
3. Make sure `ENCRYPTION_KEY` is a secure random 32-byte string (you can generate one with: `openssl rand -base64 32`)

## Function Details

### prepare-token

**Endpoint:** `POST /functions/v1/prepare-token`

**Request Body:**

```json
{
  "issuerPublicKey": "G...ISSUER",
  "tokenCode": "MENDOZA25",
  "wineName": "Gran Reserva Malbec 2025",
  "wineryName": "Viña Example",
  "region": "Mendoza",
  "country": "Argentina",
  "vintage": 2025,
  "bottleFormatMl": 750,
  "bottleCount": 1200,
  "pricePerBottleUsd": 150,
  "custodialPartner": "WineTrust Vaults",
  "documentationUrls": [
    "https://storage/.../coa.pdf",
    "https://storage/.../warehouse.jpg"
  ],
  "platformFeeBps": 1000,
  "unitsPerBottle": 1,
  "description": "Single-vineyard lot"
}
```

**Response:**

```json
{
  "success": true,
  "distributionAccount": "GXXXXX...",
  "wineLotId": "uuid",
  "totalTokenSupply": "1200.0000000",
  "trustlineTxHash": "tx-hash" // present when automatic trustline succeeds
}
```

**What it does:**

1. Validates winery + lot payload and issuer Stellar account.
2. Calculates total token supply from bottles/units.
3. Creates a dedicated distribution wallet, encrypts its secret, and stores the wine lot in `wine_lots`.
4. Funds the wallet (friendbot on testnets or `PLATFORM_FUNDING_SECRET_KEY` on mainnet) and creates a trustline to the issuer asset.
5. Sets the lot status to `trustline_created` once the transaction succeeds.

### status

**Endpoint:** `GET /functions/v1/status?code=MENDOZA25&issuer=G...ISSUER`

Returns the current lot state, marketplace metadata, plus the latest issuance/distribution snapshot:

```json
{
  "status": "tokens_emitted",
  "tokenCode": "MENDOZA25",
  "wineryName": "Viña Example",
  "region": "Mendoza",
  "country": "Argentina",
  "vintage": 2025,
  "bottleCount": 1200,
  "pricePerBottleUsd": 150,
  "platformFeeBps": 1000,
  "documentationUrls": ["https://storage/..."],
  "distributionAccount": "G...DISTRO",
  "trustlineTxHash": "tx-hash",
  "emissionTxHash": "tx-hash",
  "distributionTxHash": null,
  "createdAt": "...",
  "emittedAt": "...",
  "distributedAt": null,
  "latestIssuance": {
    "totalSupply": "1200.0000000",
    "pricePerUnitUsd": 150,
    "reserveRatioBps": 1500,
    "emissionTxHash": "tx-hash",
    "issuedAt": "..."
  },
  "latestDistribution": null
}
```

### emission-xdr

**Endpoint:** `POST /functions/v1/emission-xdr`

Generates an unsigned payment transaction (issuer → distribution) after validating the lot:

```json
{
  "issuerPublicKey": "G...ISSUER",
  "tokenCode": "MENDOZA25",
  "totalSupply": "1200.0000000",
  "pricePerUnitUsd": 150,
  "reserveRatioBps": 1500
}
```

Response includes the unsigned `xdr`, the target distribution wallet, and updates `wine_token_issuances`.

### submit-signed

**Endpoint:** `POST /functions/v1/submit-signed`

```json
{
  "signedXDR": "AAAA...",
  "tokenCode": "MENDOZA25",
  "issuerPublicKey": "G...ISSUER"
}
```

On success the function:

- Submits the transaction to Horizon.
- Updates `wine_lots` status to `tokens_emitted`.
- Records the hash + timestamps in both `wine_lots` and `wine_token_issuances`.

### distribute

**Endpoint:** `POST /functions/v1/distribute`

```json
{
  "issuerPublicKey": "G...ISSUER",
  "tokenCode": "MENDOZA25",
  "wineryPayoutPublicKey": "G...WINERY",   // optional if winery keeps assets in distribution acct
  "reservePublicKey": "G...RESERVE"       // optional reserve wallet for liquidity pools
}
```

After verifying the lot and the minted supply, the function:

1. Calculates allocations (winery/platform/reserve) based on platform fee BPS + issuance reserve ratio.
2. Ensures each destination has the necessary trustline (auto-creates for platform treasury if `PLATFORM_TREASURY_SECRET_KEY` is set).
3. Submits a multi-operation transaction paying each destination.
4. Updates `wine_lots` to `distributed` and inserts an audit row in `wine_distributions`.

### list-distributed-tokens

**Endpoint:** `GET /functions/v1/list-distributed-tokens?limit=100&offset=0`

Returns paginated rows straight from `wine_marketplace_view`:

```json
{
  "lots": [
    {
      "wine_lot_id": "uuid",
      "winery_name": "Viña Example",
      "region": "Mendoza",
      "country": "Argentina",
      "vintage": 2025,
      "bottle_count": 1200,
      "price_per_bottle_usd": 150,
      "token_code": "MENDOZA25",
      "status": "distributed",
      "total_supply": "1200.0000000",
      "price_per_unit_usd": 150,
      "distribution_tx_hash": "tx-hash",
      "distribution_at": "..."
    }
  ],
  "count": 1,
  "limit": 100,
  "offset": 0
}
```

## Network Configuration

The functions automatically detect the network from the `STELLAR_NETWORK` environment variable:

- `PUBLIC` - Mainnet (default)
- `TESTNET` - Testnet
- `FUTURENET` - Futurenet

## Security Notes

1. **ENCRYPTION_KEY**: Must be kept secret and never exposed. Used to encrypt distribution account secrets.
2. **PLATFORM_FUNDING_SECRET_KEY**: Only needed if you want automatic account funding. Keep this secure.
3. **PLATFORM_TREASURY_PUBLIC_KEY**: Public key is safe, but make sure the corresponding secret key is secure.
4. **Service Role Key**: Has full database access, keep it secure.

## Testing

Test each function individually using curl or your frontend:

```bash
# Test prepare-token
curl -X POST https://your-project.supabase.co/functions/v1/prepare-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"artistPublicKey":"GXXXXX...","tokenCode":"TEST","tokenName":"Test Token","totalSupply":"1000000"}'

# Test status
curl "https://your-project.supabase.co/functions/v1/status?code=TEST&issuer=GXXXXX..." \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Troubleshooting

1. **Account funding fails**: Make sure `PLATFORM_FUNDING_SECRET_KEY` is set and the funding account has enough XLM
2. **Trustline creation fails**: Ensure the distribution account is funded before creating trustline
3. **Encryption errors**: Verify `ENCRYPTION_KEY` is set and is a valid string
4. **Database errors**: Ensure all migrations have been run and tables exist

## Flow Diagram

```
1. prepare-token
   ├─ Validate wine lot metadata
   ├─ Create/fund distribution wallet
   └─ Create issuer trustline automatically

2. status (polling)
   └─ Read combined wine lot + issuance + distribution state

3. emission-xdr
   └─ Generate issuer → distribution payment XDR

4. submit-signed
   └─ Submit signed transaction and mark lot emitted

5. distribute
   ├─ Compute winery/platform/reserve allocations
   ├─ Ensure trustlines exist
   └─ Send payouts + update records
```

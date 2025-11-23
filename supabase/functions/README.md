# Supabase Edge Functions for WineFi

This directory contains Supabase Edge Functions that provide the backend API for the WineFi wine tokenization and traceability platform. These functions integrate with Stellar/Soroban smart contracts and manage custodial wallets for seamless user experience.

## Overview

The edge functions are organized into four main categories:

1. **Wine Token Functions** - Create, mint, and transfer wine lot tokens
2. **Wine Lot Functions** - Track and update wine lot status through the supply chain
3. **Wine Bottle Functions** - Individual bottle tracking with QR code support
4. **Wallet Functions** - Custodial wallet management for Stellar operations

All functions use shared utilities for authentication, CORS handling, Stellar network operations, and custodial wallet management.

## Quick Start

### Prerequisites

- Supabase project with database migrations applied
- Stellar/Soroban contracts deployed (see `contracts/` directory)
- Environment variables configured in Supabase Dashboard

### Environment Variables

Set these in your Supabase Dashboard under **Settings → Edge Functions → Secrets**:

#### Required

```bash
# Automatically provided by Supabase (no need to set manually)
SUPABASE_URL=...                # Your project URL
SUPABASE_SERVICE_ROLE_KEY=...   # Service role key
SUPABASE_ANON_KEY=...           # Anonymous key

# Required for custodial wallets
ENCRYPTION_KEY=<generate with: openssl rand -base64 32>

# Stellar Network Configuration
STELLAR_NETWORK=TESTNET         # or PUBLIC, FUTURENET
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

#### Optional

```bash
# Wine Token Factory (if using tokenization)
WINE_FACTORY_ID=CA...
TOKEN_WASM_HASH=...

# Rate Limiting (defaults shown)
WALLET_SIGN_LIMIT_PER_MIN=5
WALLET_SIGN_LIMIT_PER_HOUR=50

# Network Overrides
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Platform Features (optional)
PLATFORM_FUNDING_SECRET_KEY=S...
PLATFORM_STORAGE_BUCKET=wine-lots
```

### Deployment

```bash
# Deploy all functions
supabase functions deploy wine-tokens-create
supabase functions deploy wine-tokens-mint
supabase functions deploy wine-tokens-transfer
supabase functions deploy wine-lots-get-history
supabase functions deploy wine-lots-update-status
supabase functions deploy wine-bottles-mint
supabase functions deploy wine-bottles-get-traceability
supabase functions deploy wine-bottles-update-status
supabase functions deploy wallets-provision
supabase functions deploy wallets-default
supabase functions deploy wallets-sign-payment
supabase functions deploy wallets-auto-create

# Or deploy all at once (if supported)
supabase functions deploy
```

### Local Development

```bash
# Start local Supabase
cd supabase
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl http://localhost:54321/functions/v1/wallets-default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Function Categories

### 1. Wine Token Functions

These functions handle wine lot tokenization on the Stellar blockchain.

#### `wine-tokens-create`

Creates a new wine lot token via the factory contract.

**Endpoint:** `POST /functions/v1/wine-tokens-create`  
**Authentication:** Required (Bearer token)  
**Authorization:** Any authenticated user (becomes token admin)

**Request Body:**
```json
{
  "name": "Malbec Reserve 2024",
  "symbol": "MAL24",
  "decimal": 0,
  "wine_metadata": {
    "lot_id": "MAL-2024-001",
    "winery_name": "Bodega Catena",
    "region": "Mendoza",
    "country": "Argentina",
    "vintage": 2024,
    "varietal": "Malbec",
    "bottle_count": 1000,
    "description": "Premium Reserve",
    "token_code": "MAL24"
  }
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "address": "CA...",
    "name": "Malbec Reserve 2024",
    "symbol": "MAL24",
    "decimal": 0,
    "transaction_hash": "abc123...",
    "wine_metadata": { ... }
  }
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wine-tokens-create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Malbec Reserve 2024",
    "symbol": "MAL24",
    "decimal": 0,
    "wine_metadata": {
      "lot_id": "MAL-2024-001",
      "winery_name": "Bodega Catena",
      "region": "Mendoza",
      "country": "Argentina",
      "vintage": 2024,
      "varietal": "Malbec",
      "bottle_count": 1000,
      "token_code": "MAL24"
    }
  }'
```

#### `wine-tokens-mint`

Mints wine tokens to a recipient address. Only the token admin can mint.

**Endpoint:** `POST /functions/v1/wine-tokens-mint`  
**Authentication:** Required (Bearer token)  
**Authorization:** Token admin only

**Request Body:**
```json
{
  "token_address": "CA...",
  "recipient_address": "G...",
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "hash": "abc123...",
    "token_address": "CA...",
    "recipient": "G...",
    "amount": 100
  }
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wine-tokens-mint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "CA...",
    "recipient_address": "G...",
    "amount": 100
  }'
```

#### `wine-tokens-transfer`

Transfers wine tokens between wallets.

**Endpoint:** `POST /functions/v1/wine-tokens-transfer`  
**Authentication:** Required (Bearer token)  
**Authorization:** Token owner

**Request Body:**
```json
{
  "token_address": "CA...",
  "to_address": "G...",
  "amount": 10
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "hash": "abc123...",
    "token_address": "CA...",
    "from": "G...",
    "to": "G...",
    "amount": 10
  }
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wine-tokens-transfer \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "CA...",
    "to_address": "G...",
    "amount": 10
  }'
```

### 2. Wine Lot Functions

These functions track wine lot status through the supply chain.

#### `wine-lots-get-history`

Retrieves the complete status history for a wine lot.

**Endpoint:** `GET /functions/v1/wine-lots-get-history?token_id=...` or `POST /functions/v1/wine-lots-get-history`  
**Authentication:** Optional (public read access)  
**Authorization:** None

**Query Parameters (GET):**
- `token_id` (string, optional) - Database token ID
- `token_address` (string, optional) - On-chain token address
- `include_metadata` (boolean, optional) - Include wine metadata in response

**Request Body (POST):**
```json
{
  "token_id": "uuid...",
  "token_address": "CA...",
  "include_metadata": true
}
```

**Response:**
```json
{
  "token": {
    "id": "uuid...",
    "name": "Malbec Reserve 2024",
    "symbol": "MAL24",
    "address": "CA..."
  },
  "current_status": {
    "status": "bottled",
    "event_timestamp": "2024-01-15T10:00:00Z",
    ...
  },
  "history": [
    {
      "status": "harvested",
      "event_timestamp": "2024-01-01T10:00:00Z",
      ...
    },
    ...
  ],
  "history_count": 5
}
```

**Example:**
```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/wine-lots-get-history?token_address=CA...&include_metadata=true"
```

#### `wine-lots-update-status`

Updates the status of a wine lot. Only the token admin can update status.

**Endpoint:** `POST /functions/v1/wine-lots-update-status`  
**Authentication:** Required (Bearer token)  
**Authorization:** Token admin only

**Request Body:**
```json
{
  "token_id": "uuid...",
  "status": "bottled",
  "location": "Warehouse A",
  "location_coordinates": {
    "latitude": -34.6037,
    "longitude": -58.3816
  },
  "handler_name": "John Doe",
  "notes": "Bottled and ready for shipment",
  "metadata": {
    "temperature": "15°C",
    "humidity": "65%"
  }
}
```

**Valid Status Values:**
- `harvested` - Grapes harvested
- `fermented` - Fermentation complete
- `aged` - Aging in barrels
- `bottled` - Bottled and labeled
- `shipped` - Shipped to distributor
- `available` - Available for purchase
- `sold_out` - All bottles sold
- `recalled` - Product recall

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "uuid...",
    "token_id": "uuid...",
    "status": "bottled",
    "previous_status": "aged",
    "event_timestamp": "2024-01-15T10:00:00Z",
    ...
  },
  "message": "Status updated successfully"
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wine-lots-update-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token_id": "uuid...",
    "status": "bottled",
    "location": "Warehouse A"
  }'
```

### 3. Wine Bottle Functions

These functions handle individual bottle tracking with QR code support.

#### `wine-bottles-mint`

Creates individual bottle records from a wine lot token.

**Endpoint:** `POST /functions/v1/wine-bottles-mint`  
**Authentication:** Required (Bearer token)  
**Authorization:** Token admin only

**Request Body:**
```json
{
  "token_id": "uuid...",
  "bottle_count": 100,
  "start_number": 1,
  "generate_qr_codes": true
}
```

**Response:**
```json
{
  "success": true,
  "bottles_created": 100,
  "bottles": [
    {
      "id": "uuid...",
      "bottle_number": 1,
      "qr_code_hash": "abc123...",
      "qr_code": "QR-MAL-2024-001-0001"
    },
    ...
  ]
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wine-bottles-mint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token_id": "uuid...",
    "bottle_count": 100
  }'
```

#### `wine-bottles-get-traceability`

Public endpoint for QR code scanning and bottle verification.

**Endpoint:** `GET /functions/v1/wine-bottles-get-traceability?qr_code=...` or `POST /functions/v1/wine-bottles-get-traceability`  
**Authentication:** Optional (public access)  
**Authorization:** None

**Query Parameters (GET):**
- `qr_code` (string, optional) - QR code string
- `qr_code_hash` (string, optional) - QR code hash
- `bottle_id` (string, optional) - Database bottle ID

**Request Body (POST):**
```json
{
  "qr_code": "QR-MAL-2024-001-0001",
  "qr_code_hash": "abc123...",
  "bottle_id": "uuid..."
}
```

**Response:**
```json
{
  "bottle": {
    "id": "uuid...",
    "number": 1,
    "qr_code_hash": "abc123...",
    "current_status": "delivered",
    "current_location": "Retail Store",
    "nft_address": "CA..."
  },
  "wine": {
    "id": "uuid...",
    "name": "Malbec Reserve 2024",
    "symbol": "MAL24",
    "metadata": { ... }
  },
  "qr_code": {
    "code": "QR-MAL-2024-001-0001",
    "scan_count": 5,
    "last_scanned_at": "2024-01-15T10:00:00Z"
  },
  "bottle_history": [ ... ],
  "lot_history": [ ... ],
  "authenticity": {
    "verified": true,
    "blockchain_proof": true,
    "total_events": 8
  }
}
```

**Example:**
```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/wine-bottles-get-traceability?qr_code=QR-MAL-2024-001-0001"
```

#### `wine-bottles-update-status`

Updates individual bottle status. Admin required for most statuses; consumer scans allowed for verification.

**Endpoint:** `POST /functions/v1/wine-bottles-update-status`  
**Authentication:** Required (Bearer token)  
**Authorization:** Token admin (or consumer for scan types)

**Request Body:**
```json
{
  "bottle_id": "uuid...",
  "status": "scanned",
  "location": "Retail Store",
  "location_coordinates": {
    "latitude": -34.6037,
    "longitude": -58.3816
  },
  "handler_name": "Consumer",
  "scan_type": "consumer_scan",
  "notes": "Verified authenticity",
  "metadata": {}
}
```

**Valid Status Values:**
- `bottled` - Bottled and labeled
- `in_warehouse` - Stored in warehouse
- `shipped` - Shipped to distributor
- `in_transit` - In transit
- `delivered` - Delivered to retailer
- `scanned` - QR code scanned
- `consumed` - Bottle consumed
- `lost` - Bottle lost
- `damaged` - Bottle damaged

**Valid Scan Types:**
- `warehouse_in` - Warehouse intake
- `warehouse_out` - Warehouse outbound
- `shipping` - Shipping scan
- `delivery` - Delivery confirmation
- `retail_scan` - Retailer scan
- `consumer_scan` - Consumer verification
- `verification` - General verification

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "uuid...",
    "bottle_id": "uuid...",
    "status": "scanned",
    "previous_status": "delivered",
    "event_timestamp": "2024-01-15T10:00:00Z",
    ...
  },
  "message": "Bottle status updated successfully"
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wine-bottles-update-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bottle_id": "uuid...",
    "status": "scanned",
    "scan_type": "consumer_scan"
  }'
```

### 4. Wallet Functions

These functions manage custodial Stellar wallets for users.

#### `wallets-provision`

Creates or returns a custodial wallet for the authenticated user.

**Endpoint:** `POST /functions/v1/wallets-provision`  
**Authentication:** Required (Bearer token)  
**Authorization:** Authenticated user

**Request Body:** None (user ID from token)

**Response:**
```json
{
  "wallet": {
    "publicKey": "G...",
    "provider": "vinefi_custodial",
    "createdAt": "2024-01-01T10:00:00Z",
    "ready": true
  }
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wallets-provision \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### `wallets-default`

Returns the user's default wallet, auto-creating if it doesn't exist.

**Endpoint:** `GET /functions/v1/wallets-default`  
**Authentication:** Required (Bearer token)  
**Authorization:** Authenticated user

**Response:**
```json
{
  "wallet": {
    "publicKey": "G...",
    "provider": "vinefi_custodial",
    "createdAt": "2024-01-01T10:00:00Z",
    "ready": true
  }
}
```

**Example:**
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/wallets-default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### `wallets-sign-payment`

Signs and optionally submits Stellar payments from the custodial wallet. Rate limited.

**Endpoint:** `POST /functions/v1/wallets-sign-payment`  
**Authentication:** Required (Bearer token)  
**Authorization:** Authenticated user (wallet owner)  
**Rate Limit:** 5 per minute, 50 per hour (configurable)

**Request Body:**
```json
{
  "destination": "G...",
  "amount": "10.5",
  "asset": {
    "code": "XLM",
    "issuer": null
  },
  "memo": "Payment for wine",
  "submit": true
}
```

**Response (if submit=true):**
```json
{
  "submitted": true,
  "hash": "abc123...",
  "ledger": 12345
}
```

**Response (if submit=false):**
```json
{
  "submitted": false,
  "signedXDR": "AAAA..."
}
```

**Example:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/wallets-sign-payment \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "G...",
    "amount": "10.5",
    "submit": true
  }'
```

#### `wallets-auto-create`

Automatically creates a wallet for a user. Called internally by database triggers.

**Endpoint:** `POST /functions/v1/wallets-auto-create`  
**Authentication:** Internal (service role)  
**Authorization:** Database trigger

**Request Body:**
```json
{
  "user_id": "uuid..."
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "uuid...",
    "publicKey": "G...",
    "provider": "vinefi_custodial",
    "createdAt": "2024-01-01T10:00:00Z",
    "ready": true
  }
}
```

**Note:** This function is typically called automatically by database triggers when a user signs up. Manual calls are not recommended.

## Shared Utilities

The `_shared/` directory contains reusable utilities used across all functions.

### `_shared/auth.ts`

Authentication utilities.

- `requireAuthUser(req, supabase)` - Validates Bearer token and returns authenticated user
- `extractBearerToken(req)` - Extracts Bearer token from Authorization header

### `_shared/custodial.ts`

Custodial wallet management.

- `getOrCreateWallet(supabase, userId, options)` - Gets or creates a user wallet
- `getWalletSecret(supabase, userId)` - Retrieves and decrypts wallet secret
- `enforceWalletRateLimit(...)` - Enforces rate limits on wallet operations
- `logWalletActivity(...)` - Logs wallet activity for audit trail
- `touchWalletUsage(...)` - Updates wallet last_used_at timestamp

### `_shared/soroban.ts`

Soroban contract interaction utilities.

- `createWineToken(...)` - Creates a wine token via factory contract
- `mintWineTokens(...)` - Mints tokens from a wine token contract
- `transferWineTokens(...)` - Transfers tokens between addresses
- `invokeSorobanContract(...)` - Generic Soroban contract invocation

### `_shared/utils.ts`

General utilities.

- `handleCORS(req)` - Handles CORS preflight requests
- `corsHeaders` - Standard CORS headers
- `getStellarNetwork()` - Gets Stellar network configuration
- `getStellarClass(name)` - Gets Stellar SDK class by name
- `encryptSecret(secret, key)` - Encrypts wallet secrets
- `decryptSecret(encrypted)` - Decrypts wallet secrets
- `toAmountString(value, decimals)` - Formats amounts for Stellar
- `nowIso()` - Returns current ISO timestamp
- Status constants: `WINE_STATUS`, `LOT_STATUS`, `BOTTLE_STATUS`, `SCAN_TYPE`

## CORS Handling

All functions automatically handle CORS preflight requests. The following headers are included in all responses:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## Error Handling

All functions return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (resource doesn't exist)
- `405` - Method not allowed
- `500` - Internal server error

## Rate Limiting

Wallet functions (`wallets-sign-payment`) are rate limited to prevent abuse:
- Default: 5 requests per minute
- Default: 50 requests per hour

Configure via environment variables:
- `WALLET_SIGN_LIMIT_PER_MIN`
- `WALLET_SIGN_LIMIT_PER_HOUR`

## Database Integration

Functions interact with the following Supabase tables:

- `wine_tokens` - Wine lot token records
- `wine_token_holdings` - User token balances
- `wine_token_transactions` - Token transaction history
- `wine_lots` - Wine lot information
- `wine_lot_status_events` - Lot status change history
- `wine_bottles` - Individual bottle records
- `bottle_status_events` - Bottle status change history
- `bottle_qr_codes` - QR code mappings
- `user_wallets` - Custodial wallet records
- `wallet_activity_logs` - Wallet activity audit trail

## Blockchain Integration

Functions interact with Stellar/Soroban contracts:

- **Wine Factory Contract** - Creates wine tokens
- **Wine Token Contract** - Manages individual wine lot tokens
- **Stellar Network** - Handles payments and transfers

Contract addresses are configured via environment variables:
- `WINE_FACTORY_ID` - Factory contract address
- `TOKEN_WASM_HASH` - Token WASM hash for factory

## Security Considerations

1. **Encryption**: Wallet secrets are encrypted using `ENCRYPTION_KEY` before storage
2. **Authentication**: All sensitive operations require valid JWT tokens
3. **Authorization**: Token admins can only mint/update their own tokens
4. **Rate Limiting**: Wallet operations are rate limited to prevent abuse
5. **Audit Trail**: All wallet activities are logged for compliance
6. **CORS**: CORS is handled but should be restricted in production

## Troubleshooting

### "Factory not configured" error
- Ensure `WINE_FACTORY_ID` is set in Supabase secrets
- Verify the factory contract is deployed on the configured network

### "User wallet not found" error
- Call `wallets-provision` or `wallets-default` to create a wallet
- Ensure `ENCRYPTION_KEY` is set correctly

### "Invalid authorization" error
- Verify the Bearer token is valid and not expired
- Check that the user exists in Supabase Auth

### Rate limit exceeded
- Wait for the rate limit window to reset
- Check `wallet_activity_logs` table for recent activity
- Adjust rate limits via environment variables if needed

### Contract invocation failures
- Verify contract addresses are correct for the network
- Ensure the wallet has sufficient XLM for transaction fees
- Check network configuration matches contract deployment

## Development

### Testing Locally

```bash
# Start local Supabase
supabase start

# Serve functions
supabase functions serve

# Test with curl
curl http://localhost:54321/functions/v1/wallets-default \
  -H "Authorization: Bearer YOUR_LOCAL_TOKEN"
```

### Debugging

Functions log errors to Supabase logs. View logs in:
- Supabase Dashboard → Edge Functions → Logs
- Or via CLI: `supabase functions logs <function-name>`

### Adding New Functions

1. Create a new directory in `supabase/functions/`
2. Add `index.ts` with Deno.serve handler
3. Import shared utilities from `_shared/`
4. Handle CORS with `handleCORS()`
5. Deploy with `supabase functions deploy <function-name>`

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Deno Runtime](https://deno.land/)


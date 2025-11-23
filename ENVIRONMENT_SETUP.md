# Environment Variables Setup

This document describes all environment variables needed for the WineFi application.

## Frontend Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Wine Token Factory Configuration (Testnet)
NEXT_PUBLIC_WINE_FACTORY_ID=CAJS6NHHCY3GAZONI5J7JOJQ4SIPXSWLKYPS43DP4AYGYKGJMKUQ3EE4
NEXT_PUBLIC_TOKEN_WASM_HASH=ec26e7e8169ff94fda56e6502f84659b7f2bf2682146d66d8d70228bdea18e5c

# Stellar Network Configuration (Testnet)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### Production Configuration

For production (mainnet), update the following:

```env
NEXT_PUBLIC_WINE_FACTORY_ID=<your-mainnet-factory-id>
NEXT_PUBLIC_TOKEN_WASM_HASH=<your-mainnet-token-hash>
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-rpc.mainnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
```

## Supabase Edge Functions Environment Variables

Configure these in your Supabase dashboard under Settings > Edge Functions:

### Required Secrets

```bash
# Wine Token Factory Configuration
WINE_FACTORY_ID=CAJS6NHHCY3GAZONI5J7JOJQ4SIPXSWLKYPS43DP4AYGYKGJMKUQ3EE4
TOKEN_WASM_HASH=ec26e7e8169ff94fda56e6502f84659b7f2bf2682146d66d8d70228bdea18e5c

# Stellar Network Configuration
STELLAR_NETWORK=TESTNET
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Encryption Key for Wallet Secrets (generate a secure random key)
ENCRYPTION_KEY=your-secure-encryption-key-here
```

### Setting Secrets via CLI

```bash
# Set individual secrets
supabase secrets set WINE_FACTORY_ID=CAJS6NHHCY3GAZONI5J7JOJQ4SIPXSWLKYPS43DP4AYGYKGJMKUQ3EE4
supabase secrets set TOKEN_WASM_HASH=ec26e7e8169ff94fda56e6502f84659b7f2bf2682146d66d8d70228bdea18e5c
supabase secrets set STELLAR_NETWORK=TESTNET
supabase secrets set STELLAR_RPC_URL=https://soroban-testnet.stellar.org
supabase secrets set STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Generate and set encryption key (Linux/Mac)
supabase secrets set ENCRYPTION_KEY=$(openssl rand -base64 32)
```

## Local Development Setup

### 1. Create `.env.local`

```bash
cp ENVIRONMENT_SETUP.md .env.local
# Edit .env.local with your actual values
```

### 2. Configure Supabase Local Development

Create `supabase/.env` for local edge functions:

```env
WINE_FACTORY_ID=CAJS6NHHCY3GAZONI5J7JOJQ4SIPXSWLKYPS43DP4AYGYKGJMKUQ3EE4
TOKEN_WASM_HASH=ec26e7e8169ff94fda56e6502f84659b7f2bf2682146d66d8d70228bdea18e5c
STELLAR_NETWORK=TESTNET
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
ENCRYPTION_KEY=your-local-encryption-key
```

### 3. Run Local Supabase

```bash
# Start local Supabase (includes edge functions)
cd supabase
supabase start

# Deploy edge functions locally
supabase functions serve
```

## Environment Variable Reference

### `WINE_FACTORY_ID`
- **Description**: Address of the deployed wine token factory contract
- **Current Testnet Value**: `CAJS6NHHCY3GAZONI5J7JOJQ4SIPXSWLKYPS43DP4AYGYKGJMKUQ3EE4`
- **Used By**: Edge functions for creating wine tokens
- **Required**: Yes

### `TOKEN_WASM_HASH`
- **Description**: Hash of the uploaded wine token WASM file
- **Current Testnet Value**: `ec26e7e8169ff94fda56e6502f84659b7f2bf2682146d66d8d70228bdea18e5c`
- **Used By**: Factory contract initialization
- **Required**: Yes (for updates)

### `STELLAR_NETWORK`
- **Description**: Stellar network to use
- **Options**: `TESTNET`, `FUTURENET`, `PUBLIC` (mainnet)
- **Default**: `TESTNET`
- **Required**: Yes

### `STELLAR_RPC_URL`
- **Description**: Soroban RPC endpoint
- **Testnet**: `https://soroban-testnet.stellar.org`
- **Mainnet**: `https://soroban-rpc.mainnet.stellar.org`
- **Required**: Yes

### `STELLAR_NETWORK_PASSPHRASE`
- **Description**: Network passphrase for transaction signing
- **Testnet**: `Test SDF Network ; September 2015`
- **Mainnet**: `Public Global Stellar Network ; September 2015`
- **Required**: Yes

### `ENCRYPTION_KEY`
- **Description**: Key for encrypting wallet secrets in database
- **Format**: Base64-encoded 256-bit key
- **Generate**: `openssl rand -base64 32`
- **Required**: Yes (edge functions only)
- **⚠️ CRITICAL**: Keep this secret and never commit to version control

## Verification

### Test Frontend Configuration

```typescript
// In browser console or a test page
console.log({
  factoryId: process.env.NEXT_PUBLIC_WINE_FACTORY_ID,
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
});
```

### Test Edge Function Configuration

```bash
# Call edge function to verify it can access config
curl -X POST "https://your-project.supabase.co/functions/v1/wine-tokens-create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return an error about missing parameters (not config)
```

## Deployment Checklist

- [ ] Created `.env.local` with all `NEXT_PUBLIC_*` variables
- [ ] Set Supabase secrets for all edge function variables
- [ ] Generated secure `ENCRYPTION_KEY` for production
- [ ] Updated factory ID and token hash if redeployed
- [ ] Verified network passphrase matches network selection
- [ ] Tested wine token creation via edge function
- [ ] Confirmed frontend can load factory configuration

## Troubleshooting

### "Factory not configured" error
- Verify `WINE_FACTORY_ID` is set in Supabase secrets
- Check edge function logs in Supabase dashboard

### "Account not found" errors
- Verify user wallet was created (check `user_wallets` table)
- Ensure wallet has XLM for transaction fees
- Check wallet secret encryption/decryption works

### "Invalid network" errors
- Verify `STELLAR_NETWORK`, `STELLAR_RPC_URL`, and `STELLAR_NETWORK_PASSPHRASE` match
- Ensure they're consistent between frontend and edge functions

## Security Notes

- ⚠️ Never commit `.env.local` or real secrets to git
- ⚠️ `ENCRYPTION_KEY` must be kept secret and secure
- ⚠️ Rotate `ENCRYPTION_KEY` requires re-encrypting all wallet secrets
- ✅ Use different keys for development and production
- ✅ Store production secrets in secure vault (not just Supabase dashboard)



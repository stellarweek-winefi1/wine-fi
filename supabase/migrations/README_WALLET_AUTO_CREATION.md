# Invisible Wallet Creation on Login/Signup

This migration sets up automatic wallet creation for users when they sign up or log in for the first time.

## Overview

When a new user is created in `auth.users`, a database trigger automatically calls an edge function to create a custodial Stellar wallet for that user. This happens asynchronously and does not block the user creation process.

## Components

### 1. Database Tables

- **`user_wallets`**: Stores wallet information including encrypted secrets
- **`wallet_activity_logs`**: Logs all wallet-related activities for audit and rate limiting

### 2. Database Trigger

- **Trigger**: `trigger_create_wallet_on_signup`
- **Function**: `create_wallet_on_signup()`
- **Event**: `AFTER INSERT ON auth.users`
- **Behavior**: Asynchronously calls the `wallets-auto-create` edge function via `pg_net`

### 3. Edge Function

- **Function**: `wallets-auto-create`
- **Purpose**: Creates a wallet for a user when called from the database trigger
- **Location**: `supabase/functions/wallets-auto-create/`

## Setup Instructions

### 1. Apply the Migration

```bash
# Local development
supabase db reset

# Or apply specific migration
supabase migration up
```

### 2. Deploy the Edge Function

```bash
supabase functions deploy wallets-auto-create
```

### 3. Configure Environment Variables

The edge function requires these environment variables (automatically provided by Supabase):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `ENCRYPTION_KEY`: Key for encrypting wallet secrets (required)
- `STELLAR_NETWORK`: Network to use (TESTNET, FUTURENET, or PUBLIC)
- `PLATFORM_FUNDING_SECRET_KEY`: (Optional) For funding wallets on PUBLIC network

### 4. Configure Database Settings (Optional)

For production, you may want to set these database settings to ensure the trigger can call the edge function:

```sql
-- Set Supabase URL (if not automatically detected)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';

-- Set service role key (optional, edge function uses its own env var)
-- Note: This is sensitive and should be set via Supabase secrets, not SQL
```

## How It Works

1. **User Signs Up**: A new user is created in `auth.users`
2. **Trigger Fires**: The `trigger_create_wallet_on_signup` trigger executes
3. **HTTP Request**: The trigger uses `pg_net` to make an async HTTP POST request to the edge function
4. **Wallet Creation**: The edge function:
   - Generates a new Stellar keypair
   - Encrypts the secret key
   - Stores the wallet in `user_wallets`
   - Funds the wallet (if `PLATFORM_FUNDING_SECRET_KEY` is set or using Friendbot for testnets)
   - Logs the activity

## Error Handling

- If wallet creation fails, the user creation still succeeds
- The wallet can be created later via the `wallets-default` endpoint
- Errors are logged as warnings and don't block the signup process

## Monitoring

### Check if wallets are being created:

```sql
-- View recent wallet creations
SELECT 
    uw.id,
    uw.user_id,
    uw.public_key,
    uw.created_at,
    au.email
FROM user_wallets uw
JOIN auth.users au ON uw.user_id = au.id
ORDER BY uw.created_at DESC
LIMIT 10;
```

### Check pg_net request queue:

```sql
-- View pending requests
SELECT * FROM net.http_request_queue;

-- View recent responses
SELECT * FROM net._http_response
WHERE url LIKE '%wallets-auto-create%'
ORDER BY created DESC
LIMIT 10;
```

### Check for errors:

```sql
-- View failed wallet creation attempts
SELECT * FROM net._http_response
WHERE (status_code >= 400 OR error_msg IS NOT NULL)
AND url LIKE '%wallets-auto-create%'
ORDER BY created DESC;
```

## Troubleshooting

### Wallet not created after signup

1. **Check if pg_net worker is running**:
   ```sql
   SELECT pid FROM pg_stat_activity WHERE backend_type ILIKE '%pg_net%';
   ```
   If no result, restart the worker:
   ```sql
   SELECT net.worker_restart();
   ```

2. **Check the request queue**:
   ```sql
   SELECT COUNT(*) FROM net.http_request_queue;
   ```
   If the count doesn't decrease, the queue may be stuck.

3. **Check edge function logs** in Supabase Dashboard

4. **Verify environment variables** are set correctly

### Manual wallet creation

If automatic creation fails, users can still get their wallet via:

```bash
# Call the wallets-default endpoint
GET /functions/v1/wallets-default
Authorization: Bearer <user_jwt_token>
```

This will create the wallet if it doesn't exist.

## Security Notes

- Wallet secrets are encrypted using AES-GCM
- RLS policies ensure users can only access their own wallets
- Service role is required for wallet creation operations
- The trigger uses `SECURITY DEFINER` to make HTTP requests

## Related Functions

- `wallets-default`: Returns or creates a user's wallet
- `wallets-provision`: Explicitly provisions a wallet
- `wallets-sign-payment`: Signs transactions from the custodial wallet

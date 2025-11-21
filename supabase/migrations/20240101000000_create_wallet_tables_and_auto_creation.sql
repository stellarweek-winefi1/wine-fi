-- Migration: Create wallet tables and automatic wallet creation on user signup
-- This migration sets up the infrastructure for invisible wallet creation during login/signup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL UNIQUE,
    wallet_provider TEXT DEFAULT 'vinefi_custodial',
    network TEXT DEFAULT 'stellar',
    secret_encrypted TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    CONSTRAINT user_wallets_user_id_key UNIQUE (user_id)
);

-- Create wallet_activity_logs table
CREATE TABLE IF NOT EXISTS public.wallet_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_public_key ON public.user_wallets(public_key);
CREATE INDEX IF NOT EXISTS idx_wallet_activity_logs_wallet_id ON public.wallet_activity_logs(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_activity_logs_user_id ON public.wallet_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_activity_logs_action ON public.wallet_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_wallet_activity_logs_created_at ON public.wallet_activity_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
-- Users can only see their own wallets
CREATE POLICY "Users can view their own wallets"
    ON public.user_wallets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage all wallets"
    ON public.user_wallets
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for wallet_activity_logs
-- Users can only see their own wallet activity
CREATE POLICY "Users can view their own wallet activity"
    ON public.wallet_activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage all wallet activity"
    ON public.wallet_activity_logs
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Function to trigger wallet creation via edge function
-- Uses pg_net extension for async HTTP calls
CREATE OR REPLACE FUNCTION public.create_wallet_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_url TEXT;
    service_role_key TEXT;
    request_id BIGINT;
BEGIN
    -- Get Supabase URL from environment or use default
    -- In Supabase, the URL is typically available via current_setting
    api_url := COALESCE(
        current_setting('app.settings.supabase_url', true),
        current_setting('app.supabase_url', true),
        'http://127.0.0.1:54321'  -- Default local URL
    );
    
    -- Get service role key from secrets (set via Supabase dashboard)
    -- For local development, this will be handled by the edge function's env vars
    service_role_key := COALESCE(
        current_setting('app.settings.service_role_key', true),
        ''  -- Edge function will use its own env var
    );

    -- Call the edge function asynchronously using pg_net
    -- This is fire-and-forget, so it won't block user creation
    -- pg_net.http_post returns a request_id (bigint)
    SELECT net.http_post(
        url := api_url || '/functions/v1/wallets-auto-create',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
        ),
        body := jsonb_build_object(
            'user_id', NEW.id::text
        )
    ) INTO request_id;

    -- Log that the request was queued (non-blocking)
    IF request_id IS NULL THEN
        RAISE WARNING 'Failed to queue wallet creation request for user %', NEW.id;
    ELSE
        RAISE LOG 'Queued wallet creation request % for user %', request_id, NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail user creation if wallet creation fails
        -- Wallet can be created later via the wallets-default endpoint
        RAISE WARNING 'Error in wallet auto-creation trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger on auth.users to automatically create wallet on signup
DROP TRIGGER IF EXISTS trigger_create_wallet_on_signup ON auth.users;
CREATE TRIGGER trigger_create_wallet_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_wallet_on_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO authenticated;
GRANT SELECT ON public.wallet_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_wallet_on_signup() TO authenticated;

COMMENT ON TABLE public.user_wallets IS 'Stores custodial wallet information for users';
COMMENT ON TABLE public.wallet_activity_logs IS 'Logs all wallet-related activities for audit and rate limiting';
COMMENT ON FUNCTION public.create_wallet_on_signup() IS 'Automatically creates a wallet for new users via edge function';

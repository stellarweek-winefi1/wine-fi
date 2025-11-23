-- Migration: Create wine token tables for tracking tokenized wine lots
-- This migration adds support for wine token management and trading

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create wine_tokens table
-- Stores information about deployed wine lot tokens
CREATE TABLE IF NOT EXISTS public.wine_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factory_id TEXT NOT NULL,
    token_address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimal INTEGER DEFAULT 0,
    wine_metadata JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wine_tokens_factory_id_check CHECK (char_length(factory_id) > 0),
    CONSTRAINT wine_tokens_token_address_check CHECK (char_length(token_address) > 0),
    CONSTRAINT wine_tokens_name_check CHECK (char_length(name) > 0),
    CONSTRAINT wine_tokens_symbol_check CHECK (char_length(symbol) > 0)
);

-- Create wine_token_holdings table
-- Tracks user token balances (cached from blockchain)
CREATE TABLE IF NOT EXISTS public.wine_token_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES public.wine_tokens(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wine_token_holdings_user_token_unique UNIQUE (user_id, token_id),
    CONSTRAINT wine_token_holdings_balance_check CHECK (balance >= 0)
);

-- Create wine_token_transactions table
-- Complete transaction history for all wine token operations
CREATE TABLE IF NOT EXISTS public.wine_token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES public.wine_tokens(id) ON DELETE CASCADE,
    from_wallet UUID REFERENCES public.user_wallets(id) ON DELETE SET NULL,
    from_address TEXT,
    to_wallet UUID REFERENCES public.user_wallets(id) ON DELETE SET NULL,
    to_address TEXT NOT NULL,
    amount BIGINT NOT NULL,
    transaction_hash TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wine_token_transactions_amount_check CHECK (amount > 0),
    CONSTRAINT wine_token_transactions_type_check CHECK (transaction_type IN ('mint', 'transfer', 'burn'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wine_tokens_factory_id ON public.wine_tokens(factory_id);
CREATE INDEX IF NOT EXISTS idx_wine_tokens_token_address ON public.wine_tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_wine_tokens_created_by ON public.wine_tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_wine_tokens_admin_wallet_id ON public.wine_tokens(admin_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wine_tokens_wine_metadata ON public.wine_tokens USING GIN (wine_metadata);

CREATE INDEX IF NOT EXISTS idx_wine_token_holdings_user_id ON public.wine_token_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_token_holdings_wallet_id ON public.wine_token_holdings(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wine_token_holdings_token_id ON public.wine_token_holdings(token_id);

CREATE INDEX IF NOT EXISTS idx_wine_token_transactions_token_id ON public.wine_token_transactions(token_id);
CREATE INDEX IF NOT EXISTS idx_wine_token_transactions_from_wallet ON public.wine_token_transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_wine_token_transactions_to_wallet ON public.wine_token_transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_wine_token_transactions_transaction_hash ON public.wine_token_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_wine_token_transactions_transaction_type ON public.wine_token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wine_token_transactions_created_at ON public.wine_token_transactions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.wine_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wine_tokens
-- Anyone can view wine tokens
CREATE POLICY "Anyone can view wine tokens"
    ON public.wine_tokens
    FOR SELECT
    USING (true);

-- Only authenticated users can create wine tokens
CREATE POLICY "Authenticated users can create wine tokens"
    ON public.wine_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Only token creator can update their tokens
CREATE POLICY "Token creators can update their tokens"
    ON public.wine_tokens
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage all wine tokens"
    ON public.wine_tokens
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for wine_token_holdings
-- Users can only see their own holdings
CREATE POLICY "Users can view their own holdings"
    ON public.wine_token_holdings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all holdings
CREATE POLICY "Service role can manage all holdings"
    ON public.wine_token_holdings
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for wine_token_transactions
-- Users can see transactions involving their wallets
CREATE POLICY "Users can view their own transactions"
    ON public.wine_token_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_wallets
            WHERE user_wallets.id IN (
                wine_token_transactions.from_wallet,
                wine_token_transactions.to_wallet
            )
            AND user_wallets.user_id = auth.uid()
        )
    );

-- Service role can manage all transactions
CREATE POLICY "Service role can manage all transactions"
    ON public.wine_token_transactions
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on wine_tokens
DROP TRIGGER IF EXISTS trigger_update_wine_tokens_updated_at ON public.wine_tokens;
CREATE TRIGGER trigger_update_wine_tokens_updated_at
    BEFORE UPDATE ON public.wine_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.wine_tokens TO authenticated;
GRANT INSERT ON public.wine_tokens TO authenticated;
GRANT UPDATE ON public.wine_tokens TO authenticated;
GRANT SELECT ON public.wine_token_holdings TO authenticated;
GRANT SELECT ON public.wine_token_transactions TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.wine_tokens IS 'Stores deployed wine lot token contracts with metadata';
COMMENT ON TABLE public.wine_token_holdings IS 'Tracks user wine token balances (cached from blockchain)';
COMMENT ON TABLE public.wine_token_transactions IS 'Complete history of wine token transactions';

COMMENT ON COLUMN public.wine_tokens.wine_metadata IS 'JSON object containing: lot_id, winery_name, region, country, vintage, varietal, bottle_count, description, token_code';
COMMENT ON COLUMN public.wine_token_holdings.balance IS 'Cached balance, periodically synced with blockchain';
COMMENT ON COLUMN public.wine_token_transactions.transaction_type IS 'Type of transaction: mint, transfer, or burn';



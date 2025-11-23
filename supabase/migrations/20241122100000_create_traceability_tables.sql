-- Migration: Create wine traceability tables for lot and bottle tracking
-- This migration adds support for on-chain traceability with production lifecycle tracking

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LOT-LEVEL STATUS TRACKING
-- ============================================================================

-- Create wine_lot_status_events table
-- Tracks production lifecycle for entire wine lots
CREATE TABLE IF NOT EXISTS public.wine_lot_status_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES public.wine_tokens(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    transaction_hash TEXT,
    location TEXT,
    location_coordinates JSONB,
    handler_name TEXT,
    handler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wine_lot_status_events_status_check CHECK (
        status IN (
            'harvested',
            'fermented',
            'aged',
            'bottled',
            'shipped',
            'available',
            'sold_out',
            'recalled'
        )
    )
);

-- ============================================================================
-- INDIVIDUAL BOTTLE TRACKING (NFTs)
-- ============================================================================

-- Create wine_bottles table
-- Individual bottle records with NFT addresses
CREATE TABLE IF NOT EXISTS public.wine_bottles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES public.wine_tokens(id) ON DELETE CASCADE,
    bottle_number INTEGER NOT NULL,
    nft_address TEXT,
    qr_code_hash TEXT UNIQUE NOT NULL,
    current_owner_wallet UUID REFERENCES public.user_wallets(id) ON DELETE SET NULL,
    current_owner_address TEXT,
    current_status TEXT DEFAULT 'bottled',
    current_location TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    minted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wine_bottles_token_bottle_unique UNIQUE (token_id, bottle_number),
    CONSTRAINT wine_bottles_bottle_number_check CHECK (bottle_number > 0),
    CONSTRAINT wine_bottles_status_check CHECK (
        current_status IN (
            'bottled',
            'in_warehouse',
            'shipped',
            'in_transit',
            'delivered',
            'scanned',
            'consumed',
            'lost',
            'damaged'
        )
    )
);

-- Create bottle_status_events table
-- Individual bottle status change history
CREATE TABLE IF NOT EXISTS public.bottle_status_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bottle_id UUID NOT NULL REFERENCES public.wine_bottles(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    transaction_hash TEXT,
    location TEXT,
    location_coordinates JSONB,
    handler_name TEXT,
    handler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scan_type TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT bottle_status_events_status_check CHECK (
        status IN (
            'bottled',
            'in_warehouse',
            'shipped',
            'in_transit',
            'delivered',
            'scanned',
            'consumed',
            'lost',
            'damaged'
        )
    ),
    CONSTRAINT bottle_status_events_scan_type_check CHECK (
        scan_type IS NULL OR scan_type IN (
            'warehouse_in',
            'warehouse_out',
            'shipping',
            'delivery',
            'retail_scan',
            'consumer_scan',
            'verification'
        )
    )
);

-- Create bottle_qr_codes table
-- QR code to bottle mapping with scan tracking
CREATE TABLE IF NOT EXISTS public.bottle_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bottle_id UUID NOT NULL REFERENCES public.wine_bottles(id) ON DELETE CASCADE,
    qr_code TEXT UNIQUE NOT NULL,
    qr_code_hash TEXT UNIQUE NOT NULL,
    qr_code_type TEXT DEFAULT 'public',
    is_active BOOLEAN DEFAULT true,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    last_scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT bottle_qr_codes_scan_count_check CHECK (scan_count >= 0),
    CONSTRAINT bottle_qr_codes_type_check CHECK (
        qr_code_type IN ('public', 'private', 'internal')
    )
);

-- ============================================================================
-- VIEWS FOR UNIFIED QUERIES
-- ============================================================================

-- View: Current lot status with latest event
CREATE OR REPLACE VIEW public.wine_lot_current_status AS
SELECT DISTINCT ON (token_id)
    wlse.token_id,
    wlse.status,
    wlse.location,
    wlse.handler_name,
    wlse.event_timestamp,
    wlse.transaction_hash,
    wt.name AS token_name,
    wt.symbol AS token_symbol,
    wt.wine_metadata
FROM public.wine_lot_status_events wlse
JOIN public.wine_tokens wt ON wt.id = wlse.token_id
ORDER BY token_id, event_timestamp DESC;

-- View: Complete bottle traceability
CREATE OR REPLACE VIEW public.bottle_traceability AS
SELECT
    wb.id AS bottle_id,
    wb.bottle_number,
    wb.qr_code_hash,
    wb.current_status,
    wb.current_location,
    wb.nft_address,
    wt.id AS token_id,
    wt.name AS wine_name,
    wt.symbol AS wine_symbol,
    wt.wine_metadata,
    (
        SELECT json_agg(
            json_build_object(
                'status', bse.status,
                'timestamp', bse.event_timestamp,
                'location', bse.location,
                'handler', bse.handler_name,
                'scan_type', bse.scan_type,
                'notes', bse.notes,
                'transaction_hash', bse.transaction_hash
            ) ORDER BY bse.event_timestamp DESC
        )
        FROM public.bottle_status_events bse
        WHERE bse.bottle_id = wb.id
    ) AS status_history,
    (
        SELECT json_agg(
            json_build_object(
                'status', wlse.status,
                'timestamp', wlse.event_timestamp,
                'location', wlse.location,
                'handler', wlse.handler_name,
                'notes', wlse.notes,
                'transaction_hash', wlse.transaction_hash
            ) ORDER BY wlse.event_timestamp DESC
        )
        FROM public.wine_lot_status_events wlse
        WHERE wlse.token_id = wt.id
    ) AS lot_history
FROM public.wine_bottles wb
JOIN public.wine_tokens wt ON wt.id = wb.token_id;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for wine_lot_status_events
CREATE INDEX IF NOT EXISTS idx_wine_lot_status_events_token_id 
    ON public.wine_lot_status_events(token_id);
CREATE INDEX IF NOT EXISTS idx_wine_lot_status_events_status 
    ON public.wine_lot_status_events(status);
CREATE INDEX IF NOT EXISTS idx_wine_lot_status_events_event_timestamp 
    ON public.wine_lot_status_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wine_lot_status_events_transaction_hash 
    ON public.wine_lot_status_events(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_wine_lot_status_events_handler_id 
    ON public.wine_lot_status_events(handler_id);

-- Indexes for wine_bottles
CREATE INDEX IF NOT EXISTS idx_wine_bottles_token_id 
    ON public.wine_bottles(token_id);
CREATE INDEX IF NOT EXISTS idx_wine_bottles_qr_code_hash 
    ON public.wine_bottles(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_wine_bottles_nft_address 
    ON public.wine_bottles(nft_address);
CREATE INDEX IF NOT EXISTS idx_wine_bottles_current_status 
    ON public.wine_bottles(current_status);
CREATE INDEX IF NOT EXISTS idx_wine_bottles_current_owner_wallet 
    ON public.wine_bottles(current_owner_wallet);

-- Indexes for bottle_status_events
CREATE INDEX IF NOT EXISTS idx_bottle_status_events_bottle_id 
    ON public.bottle_status_events(bottle_id);
CREATE INDEX IF NOT EXISTS idx_bottle_status_events_status 
    ON public.bottle_status_events(status);
CREATE INDEX IF NOT EXISTS idx_bottle_status_events_event_timestamp 
    ON public.bottle_status_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_status_events_transaction_hash 
    ON public.bottle_status_events(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_bottle_status_events_handler_id 
    ON public.bottle_status_events(handler_id);

-- Indexes for bottle_qr_codes
CREATE INDEX IF NOT EXISTS idx_bottle_qr_codes_bottle_id 
    ON public.bottle_qr_codes(bottle_id);
CREATE INDEX IF NOT EXISTS idx_bottle_qr_codes_qr_code 
    ON public.bottle_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_bottle_qr_codes_qr_code_hash 
    ON public.bottle_qr_codes(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_bottle_qr_codes_is_active 
    ON public.bottle_qr_codes(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.wine_lot_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottle_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottle_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wine_lot_status_events
-- Anyone can view lot status events (transparency)
CREATE POLICY "Anyone can view lot status events"
    ON public.wine_lot_status_events
    FOR SELECT
    USING (true);

-- Only token admin can create status events
CREATE POLICY "Token admins can create lot status events"
    ON public.wine_lot_status_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wine_tokens wt
            JOIN public.user_wallets uw ON uw.id = wt.admin_wallet_id
            WHERE wt.id = token_id
            AND uw.user_id = auth.uid()
        )
    );

-- Service role can manage all lot status events
CREATE POLICY "Service role can manage all lot status events"
    ON public.wine_lot_status_events
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for wine_bottles
-- Anyone can view bottles (transparency for authenticity)
CREATE POLICY "Anyone can view bottles"
    ON public.wine_bottles
    FOR SELECT
    USING (true);

-- Only token admin can create bottles
CREATE POLICY "Token admins can create bottles"
    ON public.wine_bottles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wine_tokens wt
            JOIN public.user_wallets uw ON uw.id = wt.admin_wallet_id
            WHERE wt.id = token_id
            AND uw.user_id = auth.uid()
        )
    );

-- Service role can manage all bottles
CREATE POLICY "Service role can manage all bottles"
    ON public.wine_bottles
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for bottle_status_events
-- Anyone can view bottle status events (transparency)
CREATE POLICY "Anyone can view bottle status events"
    ON public.bottle_status_events
    FOR SELECT
    USING (true);

-- Service role can manage all bottle status events
CREATE POLICY "Service role can manage all bottle status events"
    ON public.bottle_status_events
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for bottle_qr_codes
-- Anyone can view active QR codes (for scanning)
CREATE POLICY "Anyone can view active qr codes"
    ON public.bottle_qr_codes
    FOR SELECT
    USING (is_active = true);

-- Service role can manage all QR codes
CREATE POLICY "Service role can manage all qr codes"
    ON public.bottle_qr_codes
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to auto-update updated_at on wine_bottles
DROP TRIGGER IF EXISTS trigger_update_wine_bottles_updated_at ON public.wine_bottles;
CREATE TRIGGER trigger_update_wine_bottles_updated_at
    BEFORE UPDATE ON public.wine_bottles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on bottle_qr_codes
DROP TRIGGER IF EXISTS trigger_update_bottle_qr_codes_updated_at ON public.bottle_qr_codes;
CREATE TRIGGER trigger_update_bottle_qr_codes_updated_at
    BEFORE UPDATE ON public.bottle_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bottle status when event is created
CREATE OR REPLACE FUNCTION public.update_bottle_current_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.wine_bottles
    SET 
        current_status = NEW.status,
        current_location = COALESCE(NEW.location, current_location),
        updated_at = NOW()
    WHERE id = NEW.bottle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update bottle status
DROP TRIGGER IF EXISTS trigger_update_bottle_current_status ON public.bottle_status_events;
CREATE TRIGGER trigger_update_bottle_current_status
    AFTER INSERT ON public.bottle_status_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bottle_current_status();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.wine_lot_status_events TO authenticated;
GRANT INSERT ON public.wine_lot_status_events TO authenticated;
GRANT SELECT ON public.wine_bottles TO authenticated;
GRANT INSERT ON public.wine_bottles TO authenticated;
GRANT SELECT ON public.bottle_status_events TO authenticated;
GRANT SELECT ON public.bottle_qr_codes TO authenticated;

-- Grant view access
GRANT SELECT ON public.wine_lot_current_status TO authenticated;
GRANT SELECT ON public.bottle_traceability TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.wine_lot_status_events IS 'Production lifecycle tracking for entire wine lots';
COMMENT ON TABLE public.wine_bottles IS 'Individual bottle NFTs linked to parent wine lots';
COMMENT ON TABLE public.bottle_status_events IS 'Status change history for individual bottles';
COMMENT ON TABLE public.bottle_qr_codes IS 'QR code mapping and scan tracking for bottles';

COMMENT ON VIEW public.wine_lot_current_status IS 'Current status of wine lots with latest event';
COMMENT ON VIEW public.bottle_traceability IS 'Complete traceability view for bottle journey';

COMMENT ON COLUMN public.wine_lot_status_events.status IS 'Production lifecycle: harvested, fermented, aged, bottled, shipped, available';
COMMENT ON COLUMN public.wine_lot_status_events.transaction_hash IS 'Stellar blockchain transaction hash for verification';
COMMENT ON COLUMN public.wine_bottles.bottle_number IS 'Sequential number within the lot (1 to bottle_count)';
COMMENT ON COLUMN public.wine_bottles.qr_code_hash IS 'Hash of QR code for bottle identification';
COMMENT ON COLUMN public.bottle_status_events.scan_type IS 'Type of scan event: warehouse_in, warehouse_out, shipping, delivery, retail_scan, consumer_scan, verification';


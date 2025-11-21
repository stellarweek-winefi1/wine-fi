-- Winefy wine token schema

-- wine_lots: metadata for each tokenized wine batch
CREATE TABLE IF NOT EXISTS wine_lots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    winery_name text NOT NULL,
    region text NOT NULL,
    country text NOT NULL,
    appellation text,
    vineyard text,
    vintage integer NOT NULL,
    bottle_format_ml integer NOT NULL DEFAULT 750,
    bottle_count integer NOT NULL,
    sku text,
    custodial_partner text,
    storage_location text,
    insurance_policy text,
    documentation_urls jsonb DEFAULT '[]'::jsonb,
    description text,
    price_per_bottle_usd numeric(18,6) NOT NULL,
    token_code text NOT NULL,
    issuer_public_key text NOT NULL,
    distribution_public_key text NOT NULL,
    distribution_secret_encrypted text NOT NULL,
    trustline_tx_hash text,
    emission_tx_hash text,
    distribution_tx_hash text,
    emitted_at timestamptz,
    distributed_at timestamptz,
    token_metadata jsonb DEFAULT '{}'::jsonb,
    platform_fee_bps integer NOT NULL DEFAULT 1000,
    status text NOT NULL DEFAULT 'created',
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS wine_lots_token_code_idx ON wine_lots (token_code);
CREATE INDEX IF NOT EXISTS wine_lots_status_idx ON wine_lots (status);

-- wine_token_issuances: emission + treasury accounting
CREATE TABLE IF NOT EXISTS wine_token_issuances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wine_lot_id uuid NOT NULL REFERENCES wine_lots(id) ON DELETE CASCADE,
    total_supply numeric(30,7) NOT NULL,
    price_per_unit_usd numeric(18,6) NOT NULL,
    reserve_ratio_bps integer NOT NULL DEFAULT 0,
    emission_xdr text,
    emission_tx_hash text,
    issued_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS wine_token_issuances_lot_idx ON wine_token_issuances (wine_lot_id);

-- wine_distributions: payouts to wineries/platform/investors
CREATE TABLE IF NOT EXISTS wine_distributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wine_lot_id uuid NOT NULL REFERENCES wine_lots(id) ON DELETE CASCADE,
    distribution_tx_hash text,
    winery_amount numeric(30,7) NOT NULL,
    platform_amount numeric(30,7) NOT NULL,
    reserve_amount numeric(30,7) DEFAULT 0,
    distribution_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS wine_distributions_lot_idx ON wine_distributions (wine_lot_id);

-- Views for marketplace and portfolio
CREATE OR REPLACE VIEW wine_marketplace_view AS
SELECT
    wl.id AS wine_lot_id,
    wl.winery_name,
    wl.region,
    wl.country,
    wl.vintage,
    wl.bottle_format_ml,
    wl.bottle_count,
    wl.price_per_bottle_usd,
    wl.description,
    wl.documentation_urls,
    wl.token_metadata,
    wl.token_code,
    wl.issuer_public_key,
    wl.distribution_public_key,
    wl.status,
    wt.total_supply,
    wt.price_per_unit_usd,
    wd.winery_amount,
    wd.platform_amount,
    wd.reserve_amount,
    wd.distribution_at
FROM wine_lots wl
LEFT JOIN LATERAL (
    SELECT total_supply, price_per_unit_usd
    FROM wine_token_issuances wti
    WHERE wti.wine_lot_id = wl.id
    ORDER BY created_at DESC
    LIMIT 1
) wt ON TRUE
LEFT JOIN LATERAL (
    SELECT winery_amount, platform_amount, reserve_amount, distribution_at
    FROM wine_distributions wd
    WHERE wd.wine_lot_id = wl.id
    ORDER BY distribution_at DESC
    LIMIT 1
) wd ON TRUE;

CREATE OR REPLACE VIEW wine_portfolio_view AS
SELECT
    wl.id AS wine_lot_id,
    wl.winery_name,
    wl.region,
    wl.vintage,
    wl.token_code,
    wl.issuer_public_key,
    wt.total_supply,
    wt.price_per_unit_usd,
    wd.distribution_at
FROM wine_lots wl
LEFT JOIN wine_token_issuances wt ON wt.wine_lot_id = wl.id
LEFT JOIN wine_distributions wd ON wd.wine_lot_id = wl.id;

-- Functions rely on these statuses:
-- created -> trustline_created -> emission_pending -> emission_submitted -> distributed -> live



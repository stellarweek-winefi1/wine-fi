// Wine Tokens SDK - Client-side functions for wine token operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WineLotMetadata = {
  lot_id: string;
  winery_name: string;
  region: string;
  country: string;
  vintage: number;
  varietal: string;
  bottle_count: number;
  description?: string;
  token_code: string;
};

export type WineToken = {
  id: string;
  factory_id: string;
  token_address: string;
  name: string;
  symbol: string;
  decimal: number;
  wine_metadata: WineLotMetadata;
  created_by: string;
  admin_wallet_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TokenHolding = {
  id: string;
  user_id: string;
  wallet_id: string;
  token_id: string;
  balance: number;
  last_updated: string;
  created_at: string;
  token?: WineToken;
};

export type TokenTransaction = {
  id: string;
  token_id: string;
  from_wallet: string | null;
  from_address: string | null;
  to_wallet: string | null;
  to_address: string;
  amount: number;
  transaction_hash: string;
  transaction_type: 'mint' | 'transfer' | 'burn';
  metadata: Record<string, any>;
  created_at: string;
  token?: WineToken;
};

/**
 * Create a new wine token
 */
export async function createWineToken(
  name: string,
  symbol: string,
  wineMetadata: WineLotMetadata,
  decimal: number = 0
): Promise<{ success: boolean; token?: any; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-tokens-create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          symbol,
          decimal,
          wine_metadata: wineMetadata,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create token' };
    }

    return { success: true, token: data.token };
  } catch (error) {
    console.error('Create wine token error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mint wine tokens to a recipient
 */
export async function mintWineTokens(
  tokenAddress: string,
  recipientAddress: string,
  amount: number
): Promise<{ success: boolean; transaction?: any; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-tokens-mint`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token_address: tokenAddress,
          recipient_address: recipientAddress,
          amount,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to mint tokens' };
    }

    return { success: true, transaction: data.transaction };
  } catch (error) {
    console.error('Mint wine tokens error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transfer wine tokens to another address
 */
export async function transferWineTokens(
  tokenAddress: string,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; transaction?: any; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-tokens-transfer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token_address: tokenAddress,
          to_address: toAddress,
          amount,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to transfer tokens' };
    }

    return { success: true, transaction: data.transaction };
  } catch (error) {
    console.error('Transfer wine tokens error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all wine tokens
 */
export async function getAllWineTokens(): Promise<WineToken[]> {
  const { data, error } = await supabase
    .from('wine_tokens')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get wine tokens error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get wine token by address
 */
export async function getWineToken(tokenAddress: string): Promise<WineToken | null> {
  const { data, error } = await supabase
    .from('wine_tokens')
    .select('*')
    .eq('token_address', tokenAddress)
    .single();

  if (error) {
    console.error('Get wine token error:', error);
    return null;
  }

  return data;
}

/**
 * Get user's wine token holdings
 */
export async function getUserHoldings(): Promise<TokenHolding[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('wine_token_holdings')
    .select(`
      *,
      token:wine_tokens(*)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get user holdings error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's token transactions
 */
export async function getUserTransactions(): Promise<TokenTransaction[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // Get user's wallet
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (!wallet) return [];

  const { data, error } = await supabase
    .from('wine_token_transactions')
    .select(`
      *,
      token:wine_tokens(*)
    `)
    .or(`from_wallet.eq.${wallet.id},to_wallet.eq.${wallet.id}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Get user transactions error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get transactions for a specific token
 */
export async function getTokenTransactions(tokenId: string): Promise<TokenTransaction[]> {
  const { data, error } = await supabase
    .from('wine_token_transactions')
    .select('*')
    .eq('token_id', tokenId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Get token transactions error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's wallet address
 */
export async function getUserWalletAddress(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('user_wallets')
    .select('public_key')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error('Get user wallet error:', error);
    return null;
  }

  return data?.public_key || null;
}

/**
 * Subscribe to holdings changes
 */
export function subscribeToHoldings(
  callback: (payload: any) => void
) {
  return supabase
    .channel('wine_token_holdings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wine_token_holdings',
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to transaction changes
 */
export function subscribeToTransactions(
  callback: (payload: any) => void
) {
  return supabase
    .channel('wine_token_transactions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wine_token_transactions',
      },
      callback
    )
    .subscribe();
}

// ============================================================================
// Wine Lot Status Tracking
// ============================================================================

export type LotStatus = 
  | 'harvested'
  | 'fermented'
  | 'aged'
  | 'bottled'
  | 'shipped'
  | 'available'
  | 'sold_out'
  | 'recalled';

export type LotStatusEvent = {
  id: string;
  token_id: string;
  status: LotStatus;
  previous_status: LotStatus | null;
  transaction_hash: string | null;
  location: string | null;
  location_coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  handler_name: string | null;
  handler_id: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  event_timestamp: string;
  created_at: string;
};

export type LotStatusHistory = {
  token: {
    id: string;
    name: string;
    symbol: string;
    address: string;
    wine_metadata?: WineLotMetadata;
  };
  current_status: {
    status: LotStatus;
    location: string | null;
    handler_name: string | null;
    event_timestamp: string;
    transaction_hash: string | null;
  } | null;
  history: LotStatusEvent[];
  history_count: number;
};

/**
 * Update wine lot status
 * Accepts either token_id (UUID) or token_address (contract address)
 */
export async function updateLotStatus(
  tokenIdOrAddress: string,
  status: LotStatus,
  options?: {
    location?: string;
    location_coordinates?: { latitude: number; longitude: number };
    handler_name?: string;
    notes?: string;
    metadata?: Record<string, any>;
    useTokenAddress?: boolean; // If true, treat first param as token_address
  }
): Promise<{ success: boolean; event?: LotStatusEvent; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Determine if tokenIdOrAddress is a UUID (token_id) or contract address (token_address)
    // UUIDs are typically 36 chars with dashes, contract addresses are 56 chars starting with C
    const isTokenAddress = options?.useTokenAddress || 
      (tokenIdOrAddress.length === 56 && tokenIdOrAddress.startsWith('C'));

    const requestBody: any = {
      status,
      ...options,
    };

    if (isTokenAddress) {
      requestBody.token_address = tokenIdOrAddress;
    } else {
      requestBody.token_id = tokenIdOrAddress;
    }

    // Remove useTokenAddress from request body
    delete requestBody.useTokenAddress;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-lots-update-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update status' };
    }

    return { success: true, event: data.event };
  } catch (error) {
    console.error('Update lot status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get wine lot status history
 */
export async function getLotStatusHistory(
  tokenId: string,
  includeMetadata: boolean = false
): Promise<LotStatusHistory | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-lots-get-history?token_id=${tokenId}&include_metadata=${includeMetadata}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch lot history');
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get lot status history error:', error);
    return null;
  }
}

/**
 * Get current lot status from database
 */
export async function getCurrentLotStatus(tokenId: string): Promise<LotStatusEvent | null> {
  const { data, error } = await supabase
    .from('wine_lot_status_events')
    .select('*')
    .eq('token_id', tokenId)
    .order('event_timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Get current lot status error:', error);
    return null;
  }

  return data;
}

/**
 * Get current lot status by token address
 */
export async function getCurrentLotStatusByAddress(tokenAddress: string): Promise<LotStatusEvent | null> {
  // First get the token record to get the token_id
  const token = await getWineToken(tokenAddress);
  if (!token) {
    return null;
  }
  
  return getCurrentLotStatus(token.id);
}

/**
 * Subscribe to lot status changes
 */
export function subscribeToLotStatusChanges(
  tokenId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`lot_status_changes_${tokenId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'wine_lot_status_events',
        filter: `token_id=eq.${tokenId}`,
      },
      callback
    )
    .subscribe();
}

// ============================================================================
// Individual Bottle Tracking
// ============================================================================

export type BottleStatus =
  | 'bottled'
  | 'in_warehouse'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'scanned'
  | 'consumed'
  | 'lost'
  | 'damaged';

export type ScanType =
  | 'warehouse_in'
  | 'warehouse_out'
  | 'shipping'
  | 'delivery'
  | 'retail_scan'
  | 'consumer_scan'
  | 'verification';

export type Bottle = {
  id: string;
  token_id: string;
  bottle_number: number;
  nft_address: string | null;
  qr_code_hash: string;
  current_owner_wallet: string | null;
  current_owner_address: string | null;
  current_status: BottleStatus;
  current_location: string | null;
  metadata: Record<string, any>;
  minted_at: string;
  created_at: string;
  updated_at: string;
};

export type BottleStatusEvent = {
  id: string;
  bottle_id: string;
  status: BottleStatus;
  previous_status: BottleStatus | null;
  transaction_hash: string | null;
  location: string | null;
  location_coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  handler_name: string | null;
  handler_id: string | null;
  scan_type: ScanType | null;
  notes: string | null;
  metadata: Record<string, any>;
  event_timestamp: string;
  created_at: string;
};

export type BottleTraceability = {
  bottle_id: string;
  bottle_number: number;
  qr_code_hash: string;
  current_status: BottleStatus;
  current_location: string | null;
  nft_address: string | null;
  token_id: string;
  wine_name: string;
  wine_symbol: string;
  wine_metadata: WineLotMetadata;
  status_history: Array<{
    status: BottleStatus;
    timestamp: string;
    location: string | null;
    handler: string | null;
    scan_type: ScanType | null;
    notes: string | null;
    transaction_hash: string | null;
  }>;
  lot_history: Array<{
    status: LotStatus;
    timestamp: string;
    location: string | null;
    handler: string | null;
    notes: string | null;
    transaction_hash: string | null;
  }>;
};

/**
 * Get bottles for a wine lot token
 */
export async function getBottlesByToken(tokenId: string): Promise<Bottle[]> {
  const { data, error } = await supabase
    .from('wine_bottles')
    .select('*')
    .eq('token_id', tokenId)
    .order('bottle_number', { ascending: true });

  if (error) {
    console.error('Get bottles error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get bottle traceability information by QR code hash
 */
export async function getBottleTraceability(qrCodeHash: string): Promise<BottleTraceability | null> {
  const { data, error } = await supabase
    .from('bottle_traceability')
    .select('*')
    .eq('qr_code_hash', qrCodeHash)
    .single();

  if (error) {
    console.error('Get bottle traceability error:', error);
    return null;
  }

  return data;
}

/**
 * Get bottle by ID
 */
export async function getBottle(bottleId: string): Promise<Bottle | null> {
  const { data, error } = await supabase
    .from('wine_bottles')
    .select('*')
    .eq('id', bottleId)
    .single();

  if (error) {
    console.error('Get bottle error:', error);
    return null;
  }

  return data;
}

/**
 * Subscribe to bottle status changes
 */
export function subscribeToBottleStatusChanges(
  bottleId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`bottle_status_changes_${bottleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bottle_status_events',
        filter: `bottle_id=eq.${bottleId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Mint bottles for a wine lot token
 */
export async function mintBottles(
  tokenId: string,
  bottleCount?: number,
  options?: {
    start_number?: number;
    generate_qr_codes?: boolean;
  }
): Promise<{ success: boolean; bottles_created?: number; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-bottles-mint`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token_id: tokenId,
          bottle_count: bottleCount,
          ...options,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to mint bottles' };
    }

    return {
      success: true,
      bottles_created: data.bottles_created,
    };
  } catch (error) {
    console.error('Mint bottles error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update bottle status
 */
export async function updateBottleStatus(
  bottleId: string,
  status: BottleStatus,
  options?: {
    location?: string;
    location_coordinates?: { latitude: number; longitude: number };
    handler_name?: string;
    scan_type?: ScanType;
    notes?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; event?: BottleStatusEvent; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-bottles-update-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bottle_id: bottleId,
          status,
          ...options,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update bottle status' };
    }

    return { success: true, event: data.event };
  } catch (error) {
    console.error('Update bottle status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get bottle traceability (public endpoint for QR scanning)
 */
export async function getBottleTraceabilityByQR(
  qrCode: string
): Promise<BottleTraceability | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/wine-bottles-get-traceability?qr_code=${encodeURIComponent(qrCode)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch bottle traceability');
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get bottle traceability error:', error);
    return null;
  }
}

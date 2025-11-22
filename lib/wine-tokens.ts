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

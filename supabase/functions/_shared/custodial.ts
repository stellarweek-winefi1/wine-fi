// Custodial wallet utilities shared across edge functions
import {
  decryptSecret,
  encryptSecret,
  fundDistributionAccount,
  getStellarClass,
  getStellarNetwork,
  nowIso,
} from "./utils.ts";

export type WalletRecord = {
  id: string;
  user_id: string;
  public_key: string;
  wallet_provider?: string | null;
  network?: string | null;
  secret_encrypted?: string | null;
  created_at?: string | null;
  last_used_at?: string | null;
};

type GetOptions = {
  withSecret?: boolean;
  fund?: boolean;
};

const Keypair = getStellarClass("Keypair");

if (!Keypair) {
  throw new Error("Keypair class not available from Stellar SDK");
}

async function fetchWalletRecord(
  supabase: any,
  userId: string,
  withSecret = false,
): Promise<WalletRecord | null> {
  const columns = [
    "id",
    "user_id",
    "public_key",
    "wallet_provider",
    "network",
    "created_at",
    "last_used_at",
  ];
  if (withSecret) {
    columns.push("secret_encrypted");
  }

  const { data, error } = await supabase
    .from("user_wallets")
    .select(columns.join(","))
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load wallet record: ${error.message}`);
  }

  return data ?? null;
}

async function insertWalletRecord(
  supabase: any,
  userId: string,
  secretEncrypted: string,
  publicKey: string,
): Promise<WalletRecord> {
  const { data, error } = await supabase
    .from("user_wallets")
    .insert({
      user_id: userId,
      public_key: publicKey,
      secret_encrypted: secretEncrypted,
      wallet_provider: "vinefi_custodial",
      network: "stellar",
      metadata: {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert wallet record: ${error.message}`);
  }

  return data;
}

export async function getOrCreateWallet(
  supabase: any,
  userId: string,
  options: GetOptions = {},
): Promise<{ wallet: WalletRecord; secret?: string }> {
  const { withSecret = false, fund = true } = options;

  // Attempt to load existing wallet
  const existing = await fetchWalletRecord(supabase, userId, withSecret);
  if (existing) {
    const secret = withSecret && existing.secret_encrypted
      ? await decryptSecret(existing.secret_encrypted)
      : undefined;
    return { wallet: existing, secret };
  }

  // Create new wallet
  const keypair = Keypair.random();
  const secret = keypair.secret();
  const secretEncrypted = await encryptSecret(secret);
  let wallet: WalletRecord;

  try {
    wallet = await insertWalletRecord(
      supabase,
      userId,
      secretEncrypted,
      keypair.publicKey(),
    );
  } catch (error) {
    // Handle race condition where another request may have created the wallet
    console.error("Wallet insert error, retrying fetch:", error);
    const retry = await fetchWalletRecord(supabase, userId, withSecret);
    if (retry) {
      const retrySecret = withSecret && retry.secret_encrypted
        ? await decryptSecret(retry.secret_encrypted)
        : undefined;
      return { wallet: retry, secret: retrySecret };
    }
    throw error;
  }

  if (fund) {
    const { server, networkPassphrase, network } = getStellarNetwork();
    await fundDistributionAccount(
      keypair.publicKey(),
      server,
      networkPassphrase,
      network,
    );
  }

  return {
    wallet,
    secret: withSecret ? secret : undefined,
  };
}

export async function touchWalletUsage(
  supabase: any,
  walletId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_wallets")
    .update({ last_used_at: nowIso() })
    .eq("id", walletId);

  if (error) {
    console.warn("Failed to update wallet usage", error);
  }
}

export async function logWalletActivity(
  supabase: any,
  walletId: string,
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from("wallet_activity_logs")
    .insert({
      wallet_id: walletId,
      user_id: userId,
      action,
      metadata,
    });

  if (error) {
    console.warn("Failed to log wallet activity", error);
  }
}

export async function enforceWalletRateLimit(
  supabase: any,
  walletId: string,
  action: string,
  perMinute: number,
  perHour: number,
): Promise<void> {
  const now = Date.now();

  if (perMinute > 0) {
    const minuteAgo = new Date(now - 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("wallet_activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("wallet_id", walletId)
      .eq("action", action)
      .gte("created_at", minuteAgo);
    if (error) {
      console.warn("Rate limit check (minute) failed", error);
    } else if ((count ?? 0) >= perMinute) {
      throw new Error(
        `Rate limit exceeded: ${perMinute} ${action} actions per minute`,
      );
    }
  }

  if (perHour > 0) {
    const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("wallet_activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("wallet_id", walletId)
      .eq("action", action)
      .gte("created_at", hourAgo);
    if (error) {
      console.warn("Rate limit check (hour) failed", error);
    } else if ((count ?? 0) >= perHour) {
      throw new Error(
        `Rate limit exceeded: ${perHour} ${action} actions per hour`,
      );
    }
  }
}

export async function getWalletSecret(
  supabase: any,
  userId: string,
): Promise<{ wallet: WalletRecord; secret: string }> {
  const { wallet, secret } = await getOrCreateWallet(supabase, userId, {
    withSecret: true,
    fund: true,
  });
  if (!secret) {
    throw new Error("Wallet secret unavailable");
  }
  return { wallet, secret };
}


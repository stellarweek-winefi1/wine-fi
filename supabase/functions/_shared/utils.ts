// Shared utilities for Supabase Edge Functions
// Import Stellar SDK - using jsdelivr with +esm suffix for automatic ESM conversion
// @ts-ignore - Deno runtime, type checking happens at runtime
import * as StellarSdk from "https://cdn.jsdelivr.net/npm/@stellar/stellar-sdk@14.2.0/+esm";

// Stellar base fee (100 stroops = 0.00001 XLM)
// This is the minimum fee per operation in Stellar
export const BASE_FEE = "100";

export const WINE_STATUS = {
  CREATED: "created",
  TRUSTLINE_CREATED: "trustline_created",
  EMISSION_PENDING: "emission_pending",
  TOKENS_EMITTED: "tokens_emitted",
  DISTRIBUTED: "distributed",
  LIVE: "live",
} as const;

export type WineStatus = (typeof WINE_STATUS)[keyof typeof WINE_STATUS];

export function nowIso(): string {
  return new Date().toISOString();
}

export function toAmountString(
  value: string | number,
  decimals = 7,
  fieldName = "amount",
): string {
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value || 0));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${fieldName}`);
  }
  if (parsed < 0) {
    throw new Error(`${fieldName} must be non-negative`);
  }
  return parsed.toFixed(decimals);
}

export function ensurePositiveInteger(
  value: unknown,
  fieldName: string,
): number {
  const parsed = typeof value === "number"
    ? value
    : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return parsed;
}

export function ensureNumber(
  value: unknown,
  fieldName: string,
  { min }: { min?: number } = {},
): number {
  const parsed = typeof value === "number"
    ? value
    : parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (typeof min === "number" && parsed < min) {
    throw new Error(`${fieldName} must be >= ${min}`);
  }
  return parsed;
}

export function deriveTokenSupply(
  bottleCount: number,
  unitsPerBottle = 1,
): string {
  const total = bottleCount * unitsPerBottle;
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Derived token supply must be positive");
  }
  return toAmountString(total, 7, "tokenSupply");
}

// Export Stellar SDK for use in other functions
export const Stellar = StellarSdk;

// Helper function to get Stellar SDK classes with multiple fallback patterns
export function getStellarClass(className: string): any {
  // Try direct access
  if ((StellarSdk as any)[className]) {
    return (StellarSdk as any)[className];
  }

  // Try default export
  if ((StellarSdk as any).default?.[className]) {
    return (StellarSdk as any).default[className];
  }

  // Try default as function
  if (typeof (StellarSdk as any).default === "function") {
    const sdk = (StellarSdk as any).default();
    if (sdk?.[className]) {
      return sdk[className];
    }
  }

  // Try nested Horizon namespace (for Server)
  if (className === "Server" || className === "HorizonServer") {
    if ((StellarSdk as any).Horizon?.Server) {
      return (StellarSdk as any).Horizon.Server;
    }
    if ((StellarSdk as any).default?.Horizon?.Server) {
      return (StellarSdk as any).default.Horizon.Server;
    }
  }

  // Log available keys for debugging
  const keys = Object.keys(StellarSdk);
  console.error(`Class ${className} not found. Available keys:`, keys);

  return null;
}

// CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400", // 24 hours
};

// Handle CORS preflight requests
export function handleCORS(req: Request): Response | null {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

// Stellar network passphrases (official passphrases)
const NETWORK_PASSPHRASES = {
  TESTNET: "Test SDF Network ; September 2015",
  FUTURENET: "Test SDF Future Network ; October 2022",
  PUBLIC: "Public Global Stellar Network ; September 2015",
} as const;

// Get Stellar network configuration
export function getStellarNetwork() {
  const network = Deno.env.get("STELLAR_NETWORK") || "PUBLIC";
  const horizonUrl =
    Deno.env.get("HORIZON_URL") ||
    (network === "TESTNET"
      ? "https://horizon-testnet.stellar.org"
      : network === "FUTURENET"
        ? "https://horizon-futurenet.stellar.org"
        : "https://horizon.stellar.org");

  // Use explicit passphrase strings instead of StellarSdk.Networks
  const networkPassphrase =
    network === "TESTNET"
      ? NETWORK_PASSPHRASES.TESTNET
      : network === "FUTURENET"
        ? NETWORK_PASSPHRASES.FUTURENET
        : NETWORK_PASSPHRASES.PUBLIC;

  // Access Horizon.Server using helper function
  const Server = getStellarClass("Server") || getStellarClass("HorizonServer");

  if (!Server) {
    // Log available keys for debugging
    const keys = Object.keys(StellarSdk);
    const defaultKeys = (StellarSdk as any).default
      ? Object.keys((StellarSdk as any).default)
      : [];
    console.error("Available StellarSdk keys:", keys);
    if (defaultKeys.length > 0) {
      console.error("Available StellarSdk.default keys:", defaultKeys);
    }
    throw new Error(
      `Horizon.Server not found in Stellar SDK. Available keys: ${keys.join(", ")}`,
    );
  }

  return {
    network,
    horizonUrl,
    networkPassphrase,
    server: new Server(horizonUrl),
  };
}

// Encryption utilities
export async function encryptSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const key = await getEncryptionKey();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  const encrypted = new Uint8Array(iv.length + encryptedData.byteLength);
  encrypted.set(iv);
  encrypted.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...encrypted));
}

export async function decryptSecret(encryptedSecret: string): Promise<string> {
  try {
    if (!encryptedSecret || typeof encryptedSecret !== "string") {
      throw new Error("Encrypted secret must be a non-empty string");
    }

    const key = await getEncryptionKey();

    // Decode base64
    let encryptedBytes: Uint8Array;
    try {
      const base64Decoded = atob(encryptedSecret);
      encryptedBytes = new Uint8Array(base64Decoded.length);
      for (let i = 0; i < base64Decoded.length; i++) {
        encryptedBytes[i] = base64Decoded.charCodeAt(i);
      }
    } catch (base64Error) {
      throw new Error(
        `Invalid base64 encoding: ${base64Error instanceof Error ? base64Error.message : String(base64Error)}`,
      );
    }

    if (encryptedBytes.length < 12) {
      throw new Error(
        `Encrypted data too short: ${encryptedBytes.length} bytes (expected at least 12 for IV)`,
      );
    }

    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);

    if (data.length === 0) {
      throw new Error("Encrypted data is empty after extracting IV");
    }

    // Decrypt - convert Uint8Array to ArrayBuffer for crypto.subtle
    const dataBuffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );
    const ivBuffer = iv.buffer.slice(
      iv.byteOffset,
      iv.byteOffset + iv.byteLength,
    );

    let decrypted: ArrayBuffer;
    try {
      decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBuffer },
        key,
        dataBuffer,
      );
    } catch (decryptError) {
      throw new Error(
        `Decryption failed: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}. This may indicate an ENCRYPTION_KEY mismatch.`,
      );
    }

    // Decode to string
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let secret: string;
    try {
      secret = decoder.decode(decrypted);
    } catch (decodeError) {
      throw new Error(
        `Failed to decode decrypted data: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`,
      );
    }

    // Clean up the secret: remove null bytes, trim whitespace
    secret = secret.replace(/\0/g, "").trim();

    // Validate Stellar secret key format
    if (!secret.startsWith("S")) {
      throw new Error(
        `Decrypted secret does not start with 'S'. This may indicate corruption or wrong encryption key. Secret starts with: ${secret.substring(0, 5)}`,
      );
    }

    if (secret.length !== 56) {
      throw new Error(
        `Decrypted secret has invalid length: ${secret.length} (expected 56). This may indicate corruption or wrong encryption key.`,
      );
    }

    return secret;
  } catch (error) {
    console.error("decryptSecret error:", error);
    throw error;
  }
}

async function getEncryptionKey() {
  const keyMaterial = Deno.env.get("ENCRYPTION_KEY");
  if (!keyMaterial) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  // For AES-GCM, we need a 256-bit key (32 bytes)
  // If the keyMaterial is shorter, we'll need to derive a key
  // For simplicity, we'll assume it's already 32 bytes or use a hash
  let finalKeyData = keyData;
  if (keyData.length !== 32) {
    // Hash the key material to get exactly 32 bytes
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
    finalKeyData = new Uint8Array(hashBuffer);
  }

  return await crypto.subtle.importKey(
    "raw",
    finalKeyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

// Get Friendbot URL based on network (matching frontend pattern)
function getFriendbotUrl(network: string, address: string): string | null {
  switch (network) {
    case "LOCAL":
      // For local, check if there's a friendbot URL set
      const localFriendbot = Deno.env.get("LOCAL_FRIENDBOT_URL");
      return localFriendbot ? `${localFriendbot}?addr=${address}` : null;
    case "FUTURENET":
      return `https://friendbot-futurenet.stellar.org/?addr=${address}`;
    case "TESTNET":
      return `https://friendbot.stellar.org/?addr=${address}`;
    case "PUBLIC":
    default:
      // Friendbot is not available for public network
      return null;
  }
}

// Fund distribution account
export async function fundDistributionAccount(
  publicKey: string,
  server: any, // Horizon.Server type
  networkPassphrase: string,
  network: string,
): Promise<void> {
  const fundingSecret = Deno.env.get("PLATFORM_FUNDING_SECRET_KEY");

  // If no funding secret, try friendbot for test networks
  if (!fundingSecret) {
    const friendbotUrl = getFriendbotUrl(network, publicKey);

    if (friendbotUrl) {
      console.log(
        `Funding account ${publicKey} via Friendbot: ${friendbotUrl}`,
      );
      try {
        const response = await fetch(friendbotUrl);
        if (!response.ok) {
          const text = await response.text();
          console.error(`Friendbot funding failed: ${response.status} ${text}`);
          throw new Error(
            `Friendbot funding failed: ${response.status} ${text}`,
          );
        }
        const result = await response.json();
        console.log(`Friendbot funding response:`, result);

        // Wait for the account to be created on the network
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify the account was created with retries
        let retries = 5;
        let accountVerified = false;
        while (retries > 0) {
          try {
            await server.loadAccount(publicKey);
            accountVerified = true;
            console.log(
              `Successfully funded and verified account via Friendbot: ${publicKey}`,
            );
            break;
          } catch (verifyError) {
            retries--;
            if (retries > 0) {
              console.log(
                `Account not yet available, retrying in 2 seconds... (${retries} retries left)`,
              );
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
              console.error(
                `Account verification failed after Friendbot funding:`,
                verifyError,
              );
              throw new Error(
                `Account verification failed after Friendbot funding: ${verifyError}`,
              );
            }
          }
        }

        if (accountVerified) {
          return;
        }
      } catch (error) {
        console.error(`Friendbot funding error:`, error);
        if (network === "PUBLIC") {
          throw new Error(
            "PLATFORM_FUNDING_SECRET_KEY is required for PUBLIC network",
          );
        }
        // For test networks, rethrow the error so caller can handle it
        throw error;
      }
    } else if (network === "PUBLIC") {
      throw new Error(
        "PLATFORM_FUNDING_SECRET_KEY is required for PUBLIC network",
      );
    } else {
      throw new Error(
        "No funding method available: PLATFORM_FUNDING_SECRET_KEY not set and Friendbot not available for this network",
      );
    }
  }

  // Use platform funding key if available
  try {
    const Keypair = getStellarClass("Keypair");
    const TransactionBuilder = getStellarClass("TransactionBuilder");
    const Operation = getStellarClass("Operation");

    if (!Keypair || !TransactionBuilder || !Operation) {
      throw new Error("Required Stellar SDK classes not found");
    }

    const fundingKeypair = Keypair.fromSecret(fundingSecret);
    const fundingAccount = await server.loadAccount(fundingKeypair.publicKey());

    const transaction = new TransactionBuilder(fundingAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase,
    })
      .addOperation(
        Operation.createAccount({
          destination: publicKey,
          startingBalance: "2.0", // Minimum balance for Stellar account
        }),
      )
      .setTimeout(180)
      .build();

    transaction.sign(fundingKeypair);
    await server.submitTransaction(transaction);
    console.log(`Successfully funded account using platform key: ${publicKey}`);

    // Wait for the account to be available
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Error funding account ${publicKey}:`, error);
    throw error;
  }
}

// Create artist trustline
export async function createArtistTrustline(
  artistPublicKey: string,
  asset: any, // Asset type
  limit: string,
  server: any, // Horizon.Server type
  networkPassphrase: string,
): Promise<string> {
  try {
    const TransactionBuilder = getStellarClass("TransactionBuilder");
    const Operation = getStellarClass("Operation");

    if (!TransactionBuilder || !Operation) {
      throw new Error("Required Stellar SDK classes not found");
    }

    const artistAccount = await server.loadAccount(artistPublicKey);

    const transaction = new TransactionBuilder(artistAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset: asset,
          limit: limit,
        }),
      )
      .setTimeout(180)
      .build();

    // Note: This requires the artist to sign the transaction
    // For automatic creation, you would need the artist's secret key
    // In production, you should request the artist to create the trustline
    const xdr = transaction.toXDR();
    console.log("Trustline XDR generated for artist:", artistPublicKey);
    return xdr;
  } catch (error) {
    console.error("Error creating artist trustline:", error);
    throw error;
  }
}

// ============================================================================
// Wine Token Configuration
// ============================================================================

/**
 * Get wine token factory configuration from environment
 */
export function getWineFactoryConfig() {
  const factoryId = Deno.env.get("WINE_FACTORY_ID");
  const tokenWasmHash = Deno.env.get("TOKEN_WASM_HASH");

  if (!factoryId) {
    throw new Error("WINE_FACTORY_ID environment variable not set");
  }

  return {
    factoryId,
    tokenWasmHash: tokenWasmHash || undefined,
  };
}

/**
 * Validate wine lot metadata
 */
export function validateWineLotMetadata(metadata: any): boolean {
  const requiredFields = [
    "lot_id",
    "winery_name",
    "region",
    "country",
    "vintage",
    "varietal",
    "bottle_count",
    "token_code",
  ];

  for (const field of requiredFields) {
    if (!metadata[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof metadata.vintage !== "number" || metadata.vintage < 1900 || metadata.vintage > new Date().getFullYear() + 10) {
    throw new Error("Invalid vintage year");
  }

  if (typeof metadata.bottle_count !== "number" || metadata.bottle_count <= 0) {
    throw new Error("Invalid bottle_count");
  }

  return true;
}

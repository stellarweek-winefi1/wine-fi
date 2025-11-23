// Soroban helper utilities for invoking contracts from edge functions
// @ts-ignore deno runtime
// Using esm.sh for ESM compatibility with ?bundle flag to ensure all exports are available
// Based on error logs, esm.sh exports: rpc (SorobanRpc namespace), contract (Contract class), default (main SDK)
import * as StellarSdkModule from "https://esm.sh/@stellar/stellar-sdk@14.2.0?bundle";
import { BASE_FEE, getStellarNetwork } from "./utils.ts";

// esm.sh exports: { default: SDK, rpc: SorobanRpc namespace, contract: Contract class, ... }
// Access the default export for main SDK components
const StellarSdk = (StellarSdkModule as any).default || StellarSdkModule;

// Extract Soroban components from lowercase exports
// rpc is the SorobanRpc namespace (contains Server, GetTransactionStatus, etc.)
const rpcNamespace = (StellarSdkModule as any).rpc;
// contract is the Contract class
const contractClass = (StellarSdkModule as any).contract;

// Build SorobanRpc namespace from rpc export
const SorobanRpc = rpcNamespace || StellarSdk.SorobanRpc;
// Contract class
const Contract = contractClass || StellarSdk.Contract;

// Other components - try multiple access patterns
const Address = StellarSdk.Address || (StellarSdkModule as any).Address;
const Keypair = StellarSdk.Keypair || (StellarSdkModule as any).Keypair;
const TransactionBuilder = StellarSdk.TransactionBuilder || (StellarSdkModule as any).TransactionBuilder;
const xdr = StellarSdk.xdr || (StellarSdkModule as any).xdr;

// nativeToScVal and scValToNative - try all possible locations
// These are utility functions that should be top-level exports
let nativeToScVal: any = 
  (StellarSdkModule as any).nativeToScVal ||  // Try module export first
  StellarSdk?.nativeToScVal ||               // Then default export
  (StellarSdk as any)?.nativeToScVal ||
  (StellarSdkModule as any).default?.nativeToScVal;

let scValToNative: any = 
  (StellarSdkModule as any).scValToNative ||  // Try module export first
  StellarSdk?.scValToNative ||                // Then default export
  (StellarSdk as any)?.scValToNative ||
  (StellarSdkModule as any).default?.scValToNative;

// If still not found, log available keys for debugging
if (!nativeToScVal || !scValToNative) {
  const sdkKeys = Object.keys(StellarSdk).filter(k => 
    k.toLowerCase().includes('scval') || 
    k.toLowerCase().includes('native') ||
    k.toLowerCase().includes('convert')
  );
  const moduleKeys = Object.keys(StellarSdkModule).filter(k => 
    k.toLowerCase().includes('scval') || 
    k.toLowerCase().includes('native') ||
    k.toLowerCase().includes('convert')
  );
  
  console.error("nativeToScVal/scValToNative not found. Relevant keys:", {
    sdkKeys,
    moduleKeys,
    hasDefault: !!(StellarSdkModule as any).default,
  });
}

// Verify critical components are available
if (!SorobanRpc || !Contract || !Address || !Keypair || !TransactionBuilder || !nativeToScVal || !scValToNative || !xdr) {
  const moduleKeys = Object.keys(StellarSdkModule);
  const sdkKeys = Object.keys(StellarSdk);
  const rpcKeys = rpcNamespace ? Object.keys(rpcNamespace) : [];
  
  throw new Error(
    `Soroban components not available in Stellar SDK import.\n` +
    `Missing: SorobanRpc=${!!SorobanRpc}, Contract=${!!Contract}, Address=${!!Address}, Keypair=${!!Keypair}, TransactionBuilder=${!!TransactionBuilder}, nativeToScVal=${!!nativeToScVal}, scValToNative=${!!scValToNative}, xdr=${!!xdr}\n` +
    `Module keys: ${moduleKeys.join(", ")}\n` +
    `SDK keys: ${sdkKeys.slice(0, 30).join(", ")}\n` +
    `RPC namespace keys: ${rpcKeys.join(", ")}\n` +
    `Please ensure @stellar/stellar-sdk >= 14.2.0 is properly imported from esm.sh.`,
  );
}

const EVENT_TYPE_SYMBOLS: Record<string, string> = {
  bottling: "Bottling",
  shipped: "Shipped",
  received: "Received",
  scanned: "Scanned",
};

function getRpcUrl(network: string): string {
  const override = Deno.env.get("SOROBAN_RPC_URL");
  if (override) return override;
  switch (network) {
    case "TESTNET":
      return "https://soroban-testnet.stellar.org";
    case "FUTURENET":
      return "https://rpc-futurenet.stellar.org";
    case "LOCAL":
      return "http://localhost:8000/rpc";
    case "PUBLIC":
    default:
      return "https://soroban-testnet.stellar.org";
  }
}

function allowHttp(url: string): boolean {
  return url.startsWith("http://");
}

export function stringVal(value: string) {
  // Always use xdr.ScVal.scvString directly for reliability
  // nativeToScVal might not work correctly in this environment
  try {
    const scVal = xdr.ScVal.scvString(value);
    // Verify it's valid
    if (!scVal || typeof scVal !== 'object') {
      throw new Error("xdr.ScVal.scvString returned invalid value");
    }
    return scVal;
  } catch (e) {
    console.error(`Error creating string ScVal for value: ${value}`, e);
    throw new Error(`Failed to create string ScVal: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function u32Val(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Expected positive integer for u32");
  }
  try {
    const scVal = xdr.ScVal.scvU32(value >>> 0);
    // Verify it's valid
    if (!scVal || typeof scVal !== 'object') {
      throw new Error("xdr.ScVal.scvU32 returned invalid value");
    }
    return scVal;
  } catch (e) {
    console.error(`Error creating u32 ScVal for value: ${value}`, e);
    throw new Error(`Failed to create u32 ScVal: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function addressVal(value: string) {
  try {
    const address = Address.fromString(value);
    const scVal = address.toScVal();
    // Verify it's a valid ScVal
    if (!scVal || (typeof scVal !== 'object' || (!scVal.toXDR && !scVal.switch && !scVal._switch))) {
      throw new Error(`Address.toScVal() returned invalid ScVal for address: ${value}`);
    }
    return scVal;
  } catch (error) {
    console.error(`Error converting address to ScVal: ${value}`, error);
    throw error;
  }
}

export function optionStringVal(value: string | null | undefined) {
  // Option<String> in Soroban is represented as ScVal.scvVec
  // None = empty vec, Some(value) = vec with one element
  if (value === null || value === undefined) {
    // None - empty vector
    return xdr.ScVal.scvVec([]);
  } else {
    // Some(value) - vector with one string element
    return xdr.ScVal.scvVec([stringVal(value)]);
  }
}

export function eventTypeVal(event: string) {
  const symbol = EVENT_TYPE_SYMBOLS[event.toLowerCase()];
  if (!symbol) {
    throw new Error(
      `Unsupported event type "${event}". Expected one of ${Object.keys(EVENT_TYPE_SYMBOLS).join(", ")}`,
    );
  }
  return xdr.ScVal.scvSymbol(symbol);
}

type InvokeOptions = {
  contractId: string;
  method: string;
  args: any[];
  signerSecret: string;
  fee?: string;
};

export async function invokeSorobanContract(
  options: InvokeOptions,
): Promise<{ hash: string; returnValue: unknown }> {
  const { contractId, method, args, signerSecret, fee = BASE_FEE } = options;
  const { network, networkPassphrase } = getStellarNetwork();
  const rpcUrl = getRpcUrl(network);
  // SorobanRpc is the namespace, Server is the class inside it
  const ServerClass = SorobanRpc?.Server || (SorobanRpc as any)?.default?.Server;
  if (!ServerClass) {
    throw new Error(`SorobanRpc.Server not available. SorobanRpc type: ${typeof SorobanRpc}, keys: ${SorobanRpc ? Object.keys(SorobanRpc).join(", ") : "null"}`);
  }
  const server = new ServerClass(rpcUrl, { allowHttp: allowHttp(rpcUrl) });
  const keypair = Keypair.fromSecret(signerSecret);
  const account = await server.getAccount(keypair.publicKey());

  const contract = new Contract(contractId);
  
  // Contract.call() expects ScVal objects for all arguments including method name
  // The method name should be encoded as a symbol ScVal
  // Ensure all args are proper ScVal objects
  const scValArgs = args.map((arg, index) => {
    // If arg is already an ScVal (has toXDR method or is xdr.ScVal), use it directly
    if (arg && (typeof arg.toXDR === 'function' || arg.switch || arg._switch)) {
      return arg;
    }
    // If arg is a string but should be ScVal, convert it
    if (typeof arg === 'string') {
      return xdr.ScVal.scvString(arg);
    }
    // Log unexpected types for debugging
    if (arg !== null && arg !== undefined) {
      console.warn(`Unexpected arg type at index ${index}:`, typeof arg, arg);
    }
    // Otherwise, assume it's already an ScVal or try to use it as-is
    return arg;
  });
  
  // Validate all args are ScVal before calling
  for (let i = 0; i < scValArgs.length; i++) {
    const arg = scValArgs[i];
    if (!arg || (typeof arg !== 'object' || (!arg.toXDR && !arg.switch && !arg._switch))) {
      throw new Error(`Argument at index ${i} is not a valid ScVal. Type: ${typeof arg}, Value: ${JSON.stringify(arg)}`);
    }
    // Try to serialize to verify it's valid
    try {
      if (arg.toXDR) {
        arg.toXDR();
      }
    } catch (e) {
      console.error(`Argument at index ${i} failed to serialize:`, e);
      throw new Error(`Argument at index ${i} is not serializable: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  
  // Log the method and args for debugging
  console.log(`Calling contract method: ${method} with ${scValArgs.length} arguments`);
  console.log(`Contract ID: ${contractId}`);
  console.log(`Args types:`, scValArgs.map((arg, i) => ({
    index: i,
    type: typeof arg,
    hasToXDR: !!arg?.toXDR,
    hasSwitch: !!arg?.switch,
    has_Switch: !!arg?._switch,
  })));
  
  let tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...scValArgs))
    .setTimeout(180)
    .build();

  tx = await server.prepareTransaction(tx);
  tx.sign(keypair);

  const sendResponse = await server.sendTransaction(tx);
  if (sendResponse.errorResult) {
    throw new Error(
      `Soroban transaction error: ${sendResponse.errorResult}`,
    );
  }

  const final = await waitForSoroban(server, sendResponse.hash);
  const returnValue = final.returnValue
    ? scValToNative(final.returnValue)
    : null;

  return { hash: sendResponse.hash, returnValue };
}

async function waitForSoroban(
  server: any, // Using any since SorobanRpc.Server type might not be available
  hash: string,
  timeoutMs = 30000,
) {
  const start = Date.now();
  const GetTransactionStatus = SorobanRpc?.GetTransactionStatus || (SorobanRpc as any)?.default?.GetTransactionStatus;
  if (!GetTransactionStatus) {
    throw new Error("SorobanRpc.GetTransactionStatus not available");
  }
  
  while (Date.now() - start < timeoutMs) {
    const result = await server.getTransaction(hash);
    switch (result.status) {
      case GetTransactionStatus.SUCCESS:
        return result;
      case GetTransactionStatus.FAILED:
        throw new Error(
          `Soroban transaction failed: ${result.resultXdr ?? "unknown error"}`,
        );
      case GetTransactionStatus.NOT_FOUND:
      case GetTransactionStatus.PENDING:
      default:
        await delay(1000);
    }
  }
  throw new Error("Timed out waiting for Soroban transaction confirmation");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Wine Token Specific Functions
// ============================================================================

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

/**
 * Convert a JavaScript object to ScVal map
 */
function objectToScValMap(obj: Record<string, any>): any {
  const entries: any[] = [];
  for (const [key, value] of Object.entries(obj)) {
    let scVal: any;
    try {
      if (value === null || value === undefined) {
        scVal = xdr.ScVal.scvVoid();
      } else if (typeof value === 'string') {
        scVal = xdr.ScVal.scvString(value);
      } else if (typeof value === 'number') {
        // Use u32 for small numbers, i32 for potentially negative, or i64 for larger
        if (Number.isInteger(value) && value >= 0 && value <= 4294967295) {
          scVal = xdr.ScVal.scvU32(value);
        } else {
          // For larger numbers or non-integers, use i64
          const bigIntValue = BigInt(Math.floor(value));
          scVal = xdr.ScVal.scvI64(xdr.Int64Parts.fromString(bigIntValue.toString()));
        }
      } else if (typeof value === 'boolean') {
        scVal = xdr.ScVal.scvBool(value);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        scVal = objectToScValMap(value);
      } else {
        // Fallback: convert to string
        scVal = xdr.ScVal.scvString(String(value));
      }
      
      // Verify scVal is valid
      if (!scVal || typeof scVal !== 'object') {
        throw new Error(`Failed to create ScVal for value: ${value}`);
      }
      
      // Create map entry with string key
      const keyScVal = xdr.ScVal.scvString(key);
      if (!keyScVal || typeof keyScVal !== 'object') {
        throw new Error(`Failed to create ScVal for key: ${key}`);
      }
      
      entries.push(new xdr.ScMapEntry({
        key: keyScVal,
        val: scVal,
      }));
    } catch (error) {
      console.error(`Error converting object property ${key}=${value} to ScVal:`, error);
      throw new Error(`Failed to convert object property ${key} to ScVal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  try {
    const mapScVal = xdr.ScVal.scvMap(entries);
    // Verify the map is valid
    if (!mapScVal || typeof mapScVal !== 'object') {
      throw new Error("xdr.ScVal.scvMap returned invalid value");
    }
    return mapScVal;
  } catch (error) {
    console.error("Error creating ScVal map:", error);
    throw new Error(`Failed to create ScVal map: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a new wine token via the factory contract
 */
export async function createWineToken(
  factoryId: string,
  adminSecret: string,
  tokenAdmin: string,
  decimal: number,
  name: string,
  symbol: string,
  metadata: WineLotMetadata,
): Promise<{ hash: string; tokenAddress: string }> {
  // Convert metadata object to ScVal map manually
  const metadataScVal = objectToScValMap({
    lot_id: metadata.lot_id,
    winery_name: metadata.winery_name,
    region: metadata.region,
    country: metadata.country,
    vintage: metadata.vintage,
    varietal: metadata.varietal,
    bottle_count: metadata.bottle_count,
    description: metadata.description || null,
    token_code: metadata.token_code,
  });

  const result = await invokeSorobanContract({
    contractId: factoryId,
    method: "create_wine_token",
    args: [
      addressVal(tokenAdmin),
      u32Val(decimal),
      stringVal(name),
      stringVal(symbol),
      metadataScVal,
    ],
    signerSecret: adminSecret,
  });

  return {
    hash: result.hash,
    tokenAddress: result.returnValue as string,
  };
}

/**
 * Mint wine tokens to a recipient
 */
export async function mintWineTokens(
  tokenAddress: string,
  adminSecret: string,
  recipientAddress: string,
  amount: number,
): Promise<{ hash: string }> {
  // Convert amount to i128 ScVal
  let amountScVal: any;
  if (nativeToScVal && typeof nativeToScVal === 'function') {
    try {
      amountScVal = nativeToScVal(amount, { type: "i128" });
    } catch (e) {
      // Fallback: use xdr.ScVal.scvI128 with BigInt
      const bigIntAmount = BigInt(amount);
      amountScVal = xdr.ScVal.scvI128(xdr.Int128Parts.fromString(bigIntAmount.toString()));
    }
  } else {
    // Manual i128 conversion using BigInt
    const bigIntAmount = BigInt(amount);
    amountScVal = xdr.ScVal.scvI128(xdr.Int128Parts.fromString(bigIntAmount.toString()));
  }
  
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "mint",
    args: [
      addressVal(recipientAddress),
      amountScVal,
    ],
    signerSecret: adminSecret,
  });

  return { hash: result.hash };
}

/**
 * Transfer wine tokens from one address to another
 */
export async function transferWineTokens(
  tokenAddress: string,
  fromSecret: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
): Promise<{ hash: string }> {
  // Convert amount to i128 ScVal
  let amountScVal: any;
  if (nativeToScVal && typeof nativeToScVal === 'function') {
    try {
      amountScVal = nativeToScVal(amount, { type: "i128" });
    } catch (e) {
      // Fallback: use xdr.ScVal.scvI128 with BigInt
      const bigIntAmount = BigInt(amount);
      amountScVal = xdr.ScVal.scvI128(xdr.Int128Parts.fromString(bigIntAmount.toString()));
    }
  } else {
    // Manual i128 conversion using BigInt
    const bigIntAmount = BigInt(amount);
    amountScVal = xdr.ScVal.scvI128(xdr.Int128Parts.fromString(bigIntAmount.toString()));
  }
  
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "transfer",
    args: [
      addressVal(fromAddress),
      addressVal(toAddress),
      amountScVal,
    ],
    signerSecret: fromSecret,
  });

  return { hash: result.hash };
}

/**
 * Get wine lot metadata from a token
 */
export async function getWineTokenMetadata(
  tokenAddress: string,
  anySecret: string,
): Promise<WineLotMetadata> {
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "get_wine_lot_metadata",
    args: [],
    signerSecret: anySecret,
  });

  const metadata = result.returnValue as any;
  return {
    lot_id: metadata.lot_id,
    winery_name: metadata.winery_name,
    region: metadata.region,
    country: metadata.country,
    vintage: metadata.vintage,
    varietal: metadata.varietal,
    bottle_count: metadata.bottle_count,
    description: metadata.description || undefined,
    token_code: metadata.token_code,
  };
}

/**
 * Get token balance for an address
 */
export async function getWineTokenBalance(
  tokenAddress: string,
  holderAddress: string,
  anySecret: string,
): Promise<number> {
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "balance",
    args: [addressVal(holderAddress)],
    signerSecret: anySecret,
  });

  return Number(result.returnValue);
}

/**
 * Get token name
 */
export async function getTokenName(
  tokenAddress: string,
  anySecret: string,
): Promise<string> {
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "name",
    args: [],
    signerSecret: anySecret,
  });

  return result.returnValue as string;
}

/**
 * Get token symbol
 */
export async function getTokenSymbol(
  tokenAddress: string,
  anySecret: string,
): Promise<string> {
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "symbol",
    args: [],
    signerSecret: anySecret,
  });

  return result.returnValue as string;
}

// ============================================================================
// Wine Lot Status Tracking (Blockchain Events)
// ============================================================================

/**
 * Update wine lot status on-chain
 * This creates an immutable blockchain record of the status change
 * 
 * The contract method signature is:
 * set_status(status: String, location: Option<String>, previous_status: Option<String>)
 */
export async function updateLotStatusOnChain(
  tokenAddress: string,
  adminSecret: string,
  status: string,
  location?: string,
  previousStatus?: string,
): Promise<{ hash: string }> {
  try {
    const result = await invokeSorobanContract({
      contractId: tokenAddress,
      method: "set_status",
      args: [
        stringVal(status),
        optionStringVal(location),
        optionStringVal(previousStatus),
      ],
      signerSecret: adminSecret,
    });

    return { hash: result.hash };
  } catch (error) {
    console.error("Blockchain status update failed:", error);
    throw error;
  }
}

/**
 * Get wine lot status from chain
 */
export async function getLotStatusFromChain(
  tokenAddress: string,
  anySecret: string,
): Promise<string | null> {
  try {
    const result = await invokeSorobanContract({
      contractId: tokenAddress,
      method: "get_status",
      args: [],
      signerSecret: anySecret,
    });

    // get_status returns Option<String>, which is a Vec
    // If empty vec, return null (None)
    // If vec has one element, return that string (Some(value))
    const returnValue = result.returnValue;
    if (!returnValue || (Array.isArray(returnValue) && returnValue.length === 0)) {
      return null;
    }
    if (Array.isArray(returnValue) && returnValue.length > 0) {
      return returnValue[0] as string;
    }
    return returnValue as string | null;
  } catch (error) {
    console.error("Failed to get status from chain:", error);
    throw error;
  }
}

/**
 * Emit a status event for a wine lot token (deprecated - use updateLotStatusOnChain)
 * @deprecated Use updateLotStatusOnChain instead
 */
export async function emitLotStatusEvent(
  tokenAddress: string,
  adminSecret: string,
  status: string,
  location?: string,
  previousStatus?: string,
): Promise<{ hash: string }> {
  return updateLotStatusOnChain(tokenAddress, adminSecret, status, location, previousStatus);
}

// ============================================================================
// Bottle NFT Functions (for individual bottle tracking)
// ============================================================================

/**
 * Create a bottle NFT contract instance
 * This would deploy a new NFT contract for tracking individual bottles
 * 
 * Note: This requires a bottle NFT contract to be deployed
 */
export async function createBottleNFT(
  factoryId: string,
  adminSecret: string,
  parentTokenAddress: string,
  bottleNumber: number,
  qrCodeHash: string,
): Promise<{ hash: string; nftAddress: string }> {
  // Placeholder for bottle NFT creation
  // This would require a separate bottle NFT factory contract
  
  const result = await invokeSorobanContract({
    contractId: factoryId,
    method: "create_bottle_nft",
    args: [
      addressVal(parentTokenAddress),
      u32Val(bottleNumber),
      stringVal(qrCodeHash),
    ],
    signerSecret: adminSecret,
  });

  return {
    hash: result.hash,
    nftAddress: result.returnValue as string,
  };
}

/**
 * Update bottle NFT status
 * Records a status change for an individual bottle on-chain
 */
export async function updateBottleNFTStatus(
  nftAddress: string,
  adminSecret: string,
  status: string,
  location?: string,
  scanType?: string,
): Promise<{ hash: string }> {
  const statusData = nativeToScVal({
    status,
    location: location || null,
    scan_type: scanType || null,
    timestamp: Date.now(),
  }, { type: "object" });

  const result = await invokeSorobanContract({
    contractId: nftAddress,
    method: "update_status",
    args: [stringVal(status), statusData],
    signerSecret: adminSecret,
  });

  return { hash: result.hash };
}

/**
 * Get bottle NFT information
 */
export async function getBottleNFTInfo(
  nftAddress: string,
  anySecret: string,
): Promise<{
  parentToken: string;
  bottleNumber: number;
  qrCodeHash: string;
  currentStatus: string;
  currentOwner: string;
}> {
  const result = await invokeSorobanContract({
    contractId: nftAddress,
    method: "get_info",
    args: [],
    signerSecret: anySecret,
  });

  const info = result.returnValue as any;
  return {
    parentToken: info.parent_token,
    bottleNumber: info.bottle_number,
    qrCodeHash: info.qr_code_hash,
    currentStatus: info.current_status,
    currentOwner: info.current_owner,
  };
}

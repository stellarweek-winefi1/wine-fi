// Soroban helper utilities for invoking contracts from edge functions
// @ts-ignore deno runtime
import * as StellarSdk from "https://cdn.jsdelivr.net/npm/@stellar/stellar-sdk@14.2.0/+esm";
import { BASE_FEE, getStellarNetwork } from "./utils.ts";

const {
  Address,
  Contract,
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} = StellarSdk as any;

if (!SorobanRpc || !Contract) {
  throw new Error(
    "Soroban components not available in Stellar SDK import. Please ensure @stellar/stellar-sdk >= 14.",
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
  return nativeToScVal(value, { type: "string" });
}

export function u32Val(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Expected positive integer for u32");
  }
  return xdr.ScVal.scvU32(value >>> 0);
}

export function addressVal(value: string) {
  return Address.fromString(value).toScVal();
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
  const server = new SorobanRpc.Server(rpcUrl, { allowHttp: allowHttp(rpcUrl) });
  const keypair = Keypair.fromSecret(signerSecret);
  const account = await server.getAccount(keypair.publicKey());

  const contract = new Contract(contractId);
  let tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
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
  server: InstanceType<typeof SorobanRpc.Server>,
  hash: string,
  timeoutMs = 30000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await server.getTransaction(hash);
    switch (result.status) {
      case SorobanRpc.GetTransactionStatus.SUCCESS:
        return result;
      case SorobanRpc.GetTransactionStatus.FAILED:
        throw new Error(
          `Soroban transaction failed: ${result.resultXdr ?? "unknown error"}`,
        );
      case SorobanRpc.GetTransactionStatus.NOT_FOUND:
      case SorobanRpc.GetTransactionStatus.PENDING:
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
  const metadataScVal = nativeToScVal({
    lot_id: metadata.lot_id,
    winery_name: metadata.winery_name,
    region: metadata.region,
    country: metadata.country,
    vintage: metadata.vintage,
    varietal: metadata.varietal,
    bottle_count: metadata.bottle_count,
    description: metadata.description || null,
    token_code: metadata.token_code,
  }, { type: "object" });

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
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "mint",
    args: [
      addressVal(recipientAddress),
      nativeToScVal(amount, { type: "i128" }),
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
  const result = await invokeSorobanContract({
    contractId: tokenAddress,
    method: "transfer",
    args: [
      addressVal(fromAddress),
      addressVal(toAddress),
      nativeToScVal(amount, { type: "i128" }),
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

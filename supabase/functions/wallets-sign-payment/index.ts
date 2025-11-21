// Wallets Sign Payment - Signs (and optionally submits) Stellar payments via custodial wallet
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import {
  BASE_FEE,
  corsHeaders,
  getStellarClass,
  getStellarNetwork,
  handleCORS,
  nowIso,
  toAmountString,
} from "../_shared/utils.ts";
import { requireAuthUser } from "../_shared/auth.ts";
import {
  enforceWalletRateLimit,
  getWalletSecret,
  logWalletActivity,
  touchWalletUsage,
} from "../_shared/custodial.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SIGN_LIMIT_PER_MIN = Number(
  Deno.env.get("WALLET_SIGN_LIMIT_PER_MIN") ?? "5",
);
const SIGN_LIMIT_PER_HOUR = Number(
  Deno.env.get("WALLET_SIGN_LIMIT_PER_HOUR") ?? "50",
);

const { server, networkPassphrase } = getStellarNetwork();
const TransactionBuilder = getStellarClass("TransactionBuilder");
const Operation = getStellarClass("Operation");
const Asset = getStellarClass("Asset");
const Keypair = getStellarClass("Keypair");
const Memo = getStellarClass("Memo");
const StrKey = getStellarClass("StrKey");

if (!TransactionBuilder || !Operation || !Keypair) {
  throw new Error("Missing Stellar SDK classes for wallet signing");
}

type PaymentRequest = {
  destination: string;
  amount: string | number;
  asset?: { code?: string; issuer?: string } | null;
  memo?: string | null;
  submit?: boolean;
};

Deno.serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) {
    return corsResponse;
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const user = await requireAuthUser(req, supabase);
    const body = await req.json() as PaymentRequest;

    if (!body.destination || !body.amount) {
      return new Response(
        JSON.stringify({ error: "destination and amount are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (StrKey && !StrKey.isValidEd25519PublicKey(body.destination)) {
      return new Response(
        JSON.stringify({ error: "Invalid Stellar destination address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const amount = toAmountString(body.amount, 7, "amount");
    const { wallet, secret } = await getWalletSecret(supabase, user.id);

    await enforceWalletRateLimit(
      supabase,
      wallet.id,
      "wallets-sign-payment",
      SIGN_LIMIT_PER_MIN,
      SIGN_LIMIT_PER_HOUR,
    );

    const sourceAccount = await server.loadAccount(wallet.public_key);
    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    });

    let paymentAsset;
    if (body.asset?.code && body.asset?.issuer && Asset) {
      paymentAsset = new Asset(body.asset.code, body.asset.issuer);
    } else {
      paymentAsset = Asset?.native ? Asset.native() : undefined;
    }

    txBuilder.addOperation(
      Operation.payment({
        destination: body.destination,
        amount,
        asset: paymentAsset,
      }),
    );

    if (body.memo && Memo) {
      txBuilder.addMemo(Memo.text(String(body.memo)));
    }

    const tx = txBuilder.setTimeout(180).build();
    const keypair = Keypair.fromSecret(secret);
    tx.sign(keypair);

    let submission = null;
    if (body.submit !== false) {
      submission = await server.submitTransaction(tx);
    }

    await touchWalletUsage(supabase, wallet.id);
    await logWalletActivity(
      supabase,
      wallet.id,
      user.id,
      "wallets-sign-payment",
      {
        destination: body.destination,
        amount,
        asset: body.asset ?? null,
        submit: body.submit !== false,
        timestamp: nowIso(),
      },
    );

    return new Response(
      JSON.stringify(
        body.submit === false
          ? {
            submitted: false,
            signedXDR: tx.toXDR(),
          }
          : {
            submitted: true,
            hash: submission?.hash,
            ledger: submission?.ledger,
          },
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("wallets-sign-payment error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});



// Wallet Provision - Creates or returns a custodial wallet for the authenticated user
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import {
  corsHeaders,
  handleCORS,
  nowIso,
} from "../_shared/utils.ts";
import { requireAuthUser } from "../_shared/auth.ts";
import {
  getOrCreateWallet,
  logWalletActivity,
  touchWalletUsage,
} from "../_shared/custodial.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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
    const { wallet } = await getOrCreateWallet(supabase, user.id, {
      withSecret: false,
      fund: true,
    });

    await touchWalletUsage(supabase, wallet.id);
    await logWalletActivity(supabase, wallet.id, user.id, "wallets-provision", {
      timestamp: nowIso(),
    });

    return new Response(
      JSON.stringify({
        wallet: {
          publicKey: wallet.public_key,
          provider: wallet.wallet_provider,
          createdAt: wallet.created_at,
          ready: true,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("wallets-provision error:", error);
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



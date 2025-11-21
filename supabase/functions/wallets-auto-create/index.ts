// Wallets Auto-Create - Automatically creates a wallet for a user (called from database trigger)
// This function is designed to be called internally by the database trigger on user signup
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";
import {
  getOrCreateWallet,
  logWalletActivity,
} from "../_shared/custodial.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Handle CORS for direct calls (though this is primarily for internal use)
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
    // Parse request body
    const body = await req.json();
    const userId = body.user_id;

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify the user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(
      userId,
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create or get the wallet (this will create if it doesn't exist)
    const { wallet, secret } = await getOrCreateWallet(supabase, userId, {
      withSecret: false,
      fund: true, // Automatically fund the wallet
    });

    // Log the automatic wallet creation
    await logWalletActivity(
      supabase,
      wallet.id,
      userId,
      "wallets-auto-create",
      {
        timestamp: new Date().toISOString(),
        triggered_by: "database_trigger",
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          id: wallet.id,
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
    console.error("wallets-auto-create error:", error);
    
    // Return success even on error to not block user creation
    // The wallet can be created later via wallets-default endpoint
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        note: "Wallet creation failed but user was created. Wallet can be created later.",
      }),
      {
        status: 200, // Return 200 to not fail the trigger
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

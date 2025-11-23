// Wine Tokens Mint - Mint wine tokens to user wallets
// Admin/winery only endpoint
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";
import { mintWineTokens } from "../_shared/soroban.ts";
import { logWalletActivity } from "../_shared/custodial.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Handle CORS
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
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      token,
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    const body = await req.json();
    const { token_address, recipient_address, amount } = body;

    if (!token_address || !recipient_address || !amount) {
      return new Response(
        JSON.stringify({
          error: "token_address, recipient_address, and amount are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "amount must be a positive number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get token from database and verify admin
    const { data: wineToken, error: tokenError } = await supabase
      .from("wine_tokens")
      .select("*, admin_wallet:user_wallets!wine_tokens_admin_wallet_id_fkey(*)")
      .eq("token_address", token_address)
      .single();

    if (tokenError || !wineToken) {
      return new Response(
        JSON.stringify({ error: "Token not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user is the admin
    if (wineToken.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: "Only token admin can mint" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get admin wallet
    const { data: adminWallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("id, public_key, secret_encrypted")
      .eq("user_id", user.id)
      .single();

    if (walletError || !adminWallet) {
      return new Response(
        JSON.stringify({ error: "Admin wallet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Decrypt wallet secret
    const { decryptSecret } = await import("../_shared/utils.ts");
    const walletSecret = decryptSecret(adminWallet.secret_encrypted);

    // Mint the tokens
    const { hash } = await mintWineTokens(
      token_address,
      walletSecret,
      recipient_address,
      amount,
    );

    // Update or insert holding record
    const { data: recipientWallet } = await supabase
      .from("user_wallets")
      .select("id, user_id")
      .eq("public_key", recipient_address)
      .maybeSingle();

    if (recipientWallet) {
      // Upsert holding
      await supabase
        .from("wine_token_holdings")
        .upsert({
          user_id: recipientWallet.user_id,
          wallet_id: recipientWallet.id,
          token_id: wineToken.id,
          balance: amount, // This should be fetched from chain for accuracy
        }, {
          onConflict: "user_id,token_id",
        });
    }

    // Log transaction
    await supabase
      .from("wine_token_transactions")
      .insert({
        token_id: wineToken.id,
        from_wallet: null, // Minting has no sender
        to_wallet: recipientWallet?.id || null,
        to_address: recipient_address,
        amount,
        transaction_hash: hash,
        transaction_type: "mint",
      });

    // Log activity
    await logWalletActivity(
      supabase,
      adminWallet.id,
      user.id,
      "wine-token-minted",
      {
        token_address,
        recipient: recipient_address,
        amount,
        transaction_hash: hash,
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          hash,
          token_address,
          recipient: recipient_address,
          amount,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("wine-tokens-mint error:", error);
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



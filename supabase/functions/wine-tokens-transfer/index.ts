// Wine Tokens Transfer - Transfer wine tokens between wallets
// Authenticated users can transfer their own tokens
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";
import { transferWineTokens } from "../_shared/soroban.ts";
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
    const { token_address, to_address, amount } = body;

    if (!token_address || !to_address || !amount) {
      return new Response(
        JSON.stringify({
          error: "token_address, to_address, and amount are required",
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

    // Get sender's wallet
    const { data: senderWallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("id, public_key, secret_encrypted")
      .eq("user_id", user.id)
      .single();

    if (walletError || !senderWallet) {
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get token info
    const { data: wineToken, error: tokenError } = await supabase
      .from("wine_tokens")
      .select("id, name, symbol")
      .eq("token_address", token_address)
      .maybeSingle();

    // Decrypt wallet secret
    const { decryptSecret } = await import("../_shared/utils.ts");
    const walletSecret = decryptSecret(senderWallet.secret_encrypted);

    // Transfer the tokens
    const { hash } = await transferWineTokens(
      token_address,
      walletSecret,
      senderWallet.public_key,
      to_address,
      amount,
    );

    // Get recipient wallet if it exists in our system
    const { data: recipientWallet } = await supabase
      .from("user_wallets")
      .select("id, user_id")
      .eq("public_key", to_address)
      .maybeSingle();

    // Log transaction if we have token in our database
    if (wineToken) {
      await supabase
        .from("wine_token_transactions")
        .insert({
          token_id: wineToken.id,
          from_wallet: senderWallet.id,
          from_address: senderWallet.public_key,
          to_wallet: recipientWallet?.id || null,
          to_address,
          amount,
          transaction_hash: hash,
          transaction_type: "transfer",
        });

      // Update sender holding
      const { data: senderHolding } = await supabase
        .from("wine_token_holdings")
        .select("balance")
        .eq("user_id", user.id)
        .eq("token_id", wineToken.id)
        .maybeSingle();

      if (senderHolding) {
        await supabase
          .from("wine_token_holdings")
          .update({
            balance: Math.max(0, (senderHolding.balance || 0) - amount),
            last_updated: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("token_id", wineToken.id);
      }

      // Update or insert recipient holding
      if (recipientWallet) {
        const { data: recipientHolding } = await supabase
          .from("wine_token_holdings")
          .select("balance")
          .eq("user_id", recipientWallet.user_id)
          .eq("token_id", wineToken.id)
          .maybeSingle();

        if (recipientHolding) {
          await supabase
            .from("wine_token_holdings")
            .update({
              balance: (recipientHolding.balance || 0) + amount,
              last_updated: new Date().toISOString(),
            })
            .eq("user_id", recipientWallet.user_id)
            .eq("token_id", wineToken.id);
        } else {
          await supabase
            .from("wine_token_holdings")
            .insert({
              user_id: recipientWallet.user_id,
              wallet_id: recipientWallet.id,
              token_id: wineToken.id,
              balance: amount,
            });
        }
      }
    }

    // Log activity
    await logWalletActivity(
      supabase,
      senderWallet.id,
      user.id,
      "wine-token-transferred",
      {
        token_address,
        recipient: to_address,
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
          from: senderWallet.public_key,
          to: to_address,
          amount,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("wine-tokens-transfer error:", error);
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

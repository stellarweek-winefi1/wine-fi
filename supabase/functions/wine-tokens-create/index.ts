// Wine Tokens Create - Create new wine lot tokens via factory
// Admin/winery only endpoint
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";
import { createWineToken, WineLotMetadata } from "../_shared/soroban.ts";
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
    const { name, symbol, decimal = 0, wine_metadata } = body;

    if (!name || !symbol || !wine_metadata) {
      return new Response(
        JSON.stringify({ error: "name, symbol, and wine_metadata are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate wine metadata
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
      if (!wine_metadata[field]) {
        return new Response(
          JSON.stringify({ error: `wine_metadata.${field} is required` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Get user's wallet to use as admin
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("id, public_key, secret_encrypted")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: "User wallet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Decrypt wallet secret
    const { decryptSecret } = await import("../_shared/utils.ts");
    const walletSecret = decryptSecret(wallet.secret_encrypted);

    // Get factory ID from environment
    const factoryId = Deno.env.get("WINE_FACTORY_ID");
    if (!factoryId) {
      return new Response(
        JSON.stringify({ error: "Factory not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create the wine token
    const { hash, tokenAddress } = await createWineToken(
      factoryId,
      walletSecret,
      wallet.public_key,
      decimal,
      name,
      symbol,
      wine_metadata as WineLotMetadata,
    );

    // Store token in database
    const { data: tokenRecord, error: insertError } = await supabase
      .from("wine_tokens")
      .insert({
        factory_id: factoryId,
        token_address: tokenAddress,
        name,
        symbol,
        decimal,
        wine_metadata,
        created_by: user.id,
        admin_wallet_id: wallet.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store token:", insertError);
      // Still return success since token was created on-chain
    }

    // Log activity
    await logWalletActivity(
      supabase,
      wallet.id,
      user.id,
      "wine-token-created",
      {
        token_address: tokenAddress,
        transaction_hash: hash,
        name,
        symbol,
        lot_id: wine_metadata.lot_id,
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        token: {
          address: tokenAddress,
          name,
          symbol,
          decimal,
          transaction_hash: hash,
          wine_metadata,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("wine-tokens-create error:", error);
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

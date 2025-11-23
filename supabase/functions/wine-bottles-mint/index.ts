// Edge function to mint individual bottle NFTs from a wine lot
// Creates bottle records linked to parent wine token
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";

interface MintBottlesRequest {
  token_id: string;
  bottle_count?: number; // If not specified, uses token's bottle_count
  start_number?: number; // Starting bottle number (default: 1)
  generate_qr_codes?: boolean; // Generate QR codes for each bottle (default: true)
}

// Simple QR code hash generation (in production, use a proper QR code library)
function generateQRCodeHash(tokenId: string, bottleNumber: number): string {
  const data = `${tokenId}-${bottleNumber}-${Date.now()}`;
  return btoa(data).replace(/[+=\/]/g, "").substring(0, 32);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body: MintBottlesRequest = await req.json();
    const {
      token_id,
      bottle_count,
      start_number = 1,
      generate_qr_codes = true,
    } = body;

    // Validate input
    if (!token_id) {
      return new Response(
        JSON.stringify({ error: "token_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get wine token information
    const { data: tokenData, error: tokenError } = await supabase
      .from("wine_tokens")
      .select("id, token_address, admin_wallet_id, wine_metadata")
      .eq("id", token_id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Wine token not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if user owns the admin wallet
    if (tokenData.admin_wallet_id) {
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("user_id")
        .eq("id", tokenData.admin_wallet_id)
        .single();

      if (walletError || !walletData || walletData.user_id !== user.id) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized: You must be the token admin to mint bottles",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Determine bottle count
    const totalBottles = bottle_count ||
      (tokenData.wine_metadata as any)?.bottle_count;

    if (!totalBottles || totalBottles <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid bottle_count. Must be positive number.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if bottles already exist
    const { data: existingBottles } = await supabase
      .from("wine_bottles")
      .select("bottle_number")
      .eq("token_id", token_id)
      .order("bottle_number", { ascending: false })
      .limit(1)
      .single();

    if (existingBottles) {
      return new Response(
        JSON.stringify({
          error: `Bottles already minted for this token. Last bottle number: ${existingBottles.bottle_number}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create bottles
    const bottles = [];
    const qrCodes = [];

    for (let i = 0; i < totalBottles; i++) {
      const bottleNumber = start_number + i;
      const qrCodeHash = generateQRCodeHash(token_id, bottleNumber);

      bottles.push({
        token_id,
        bottle_number: bottleNumber,
        qr_code_hash: qrCodeHash,
        current_status: "bottled",
        metadata: {},
      });

      if (generate_qr_codes) {
        const qrCode = `WINE-${tokenData.token_address}-${bottleNumber}`;
        qrCodes.push({
          qr_code: qrCode,
          qr_code_hash: qrCodeHash,
          qr_code_type: "public",
          is_active: true,
          scan_count: 0,
        });
      }
    }

    // Insert bottles in batches (Supabase has limits)
    const batchSize = 100;
    const insertedBottles = [];

    for (let i = 0; i < bottles.length; i += batchSize) {
      const batch = bottles.slice(i, i + batchSize);
      const { data: batchData, error: insertError } = await supabase
        .from("wine_bottles")
        .insert(batch)
        .select();

      if (insertError) {
        console.error("Error inserting bottles:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create bottles" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      insertedBottles.push(...(batchData || []));
    }

    // Insert QR codes if requested
    if (generate_qr_codes && qrCodes.length > 0) {
      // Map QR codes to bottle IDs
      const qrCodesWithBottleIds = qrCodes.map((qr, index) => {
        const bottle = insertedBottles.find(
          (b) => b.qr_code_hash === qr.qr_code_hash,
        );
        return {
          ...qr,
          bottle_id: bottle?.id,
        };
      });

      // Insert in batches
      for (let i = 0; i < qrCodesWithBottleIds.length; i += batchSize) {
        const batch = qrCodesWithBottleIds.slice(i, i + batchSize);
        const { error: qrError } = await supabase
          .from("bottle_qr_codes")
          .insert(batch);

        if (qrError) {
          console.error("Error inserting QR codes:", qrError);
          // Continue anyway - bottles are created
        }
      }
    }

    // Create initial bottled status events for all bottles
    const statusEvents = insertedBottles.map((bottle) => ({
      bottle_id: bottle.id,
      status: "bottled",
      previous_status: null,
      location: (tokenData.wine_metadata as any)?.winery_name || null,
      handler_name: user.email || "System",
      handler_id: user.id,
      notes: "Initial bottling",
      metadata: {},
      event_timestamp: new Date().toISOString(),
    }));

    // Insert status events in batches
    for (let i = 0; i < statusEvents.length; i += batchSize) {
      const batch = statusEvents.slice(i, i + batchSize);
      await supabase.from("bottle_status_events").insert(batch);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully minted ${insertedBottles.length} bottles`,
        bottles_created: insertedBottles.length,
        qr_codes_generated: generate_qr_codes ? qrCodes.length : 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error minting bottles:", error);
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


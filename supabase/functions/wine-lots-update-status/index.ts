// Edge function to update wine lot status
// Updates both database and blockchain for immutable proof
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  decryptSecret,
  handleCORS,
  LOT_STATUS,
  LotStatus,
} from "../_shared/utils.ts";
import { updateLotStatusOnChain } from "../_shared/soroban.ts";

interface StatusUpdateRequest {
  token_id?: string;
  token_address?: string;
  status: LotStatus;
  location?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  handler_name?: string;
  notes?: string;
  metadata?: Record<string, any>;
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
    const body: StatusUpdateRequest = await req.json();
    const {
      token_id,
      token_address,
      status,
      location,
      location_coordinates,
      handler_name,
      notes,
      metadata = {},
    } = body;

    // Validate input
    if ((!token_id && !token_address) || !status) {
      return new Response(
        JSON.stringify({ error: "token_id or token_address, and status are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate status value
    const validStatuses = Object.values(LOT_STATUS);
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Look up token - support both token_id (UUID) and token_address (contract address)
    let tokenData;
    let tokenError;
    
    if (token_id) {
      // Lookup by token_id (UUID from database)
      const result = await supabase
        .from("wine_tokens")
        .select("id, token_address, admin_wallet_id, wine_metadata")
        .eq("id", token_id)
        .single();
      tokenData = result.data;
      tokenError = result.error;
    } else if (token_address) {
      // Lookup by token_address (contract address)
      const result = await supabase
        .from("wine_tokens")
        .select("id, token_address, admin_wallet_id, wine_metadata")
        .eq("token_address", token_address)
        .single();
      tokenData = result.data;
      tokenError = result.error;
    }

    // Use the resolved token_id for database operations
    const resolved_token_id = tokenData?.id;

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Wine token not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!tokenData.token_address) {
      return new Response(
        JSON.stringify({ error: "Token address not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if user owns the admin wallet and get wallet secret
    let adminWalletSecret: string | null = null;
    if (tokenData.admin_wallet_id) {
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("id, user_id, secret_encrypted")
        .eq("id", tokenData.admin_wallet_id)
        .single();

      if (walletError || !walletData || walletData.user_id !== user.id) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized: You must be the token admin to update status",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Decrypt wallet secret for blockchain transaction
      if (walletData.secret_encrypted) {
        adminWalletSecret = await decryptSecret(walletData.secret_encrypted);
      }
    } else {
      return new Response(
        JSON.stringify({
          error: "Admin wallet not found for this token",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the current (previous) status
    const { data: previousEvent } = await supabase
      .from("wine_lot_status_events")
      .select("status")
      .eq("token_id", resolved_token_id)
      .order("event_timestamp", { ascending: false })
      .limit(1)
      .single();

    const previous_status = previousEvent?.status || null;

    // Update status on-chain for immutable proof
    let transaction_hash = null;

    if (adminWalletSecret && tokenData.token_address) {
      try {
        const { hash } = await updateLotStatusOnChain(
          tokenData.token_address,
          adminWalletSecret,
          status,
          location || undefined,
          previous_status || undefined,
        );
        transaction_hash = hash;
        console.log(`Status updated on-chain: ${hash}`);
      } catch (blockchainError) {
        console.error("Blockchain status update failed:", blockchainError);
        // Continue anyway - database record is primary, blockchain is proof
        // But log the error for debugging
      }
    } else {
      console.warn("Cannot update status on-chain: missing admin wallet secret or token address");
    }

    // Insert status event into database
    const { data: statusEvent, error: insertError } = await supabase
      .from("wine_lot_status_events")
      .insert({
        token_id: resolved_token_id,
        status,
        previous_status,
        transaction_hash,
        location,
        location_coordinates,
        handler_name: handler_name || user.email || "Unknown",
        handler_id: user.id,
        notes,
        metadata,
        event_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting status event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record status update" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Publish realtime event for subscribers
    await supabase.from("wine_lot_status_events").select().eq("id", statusEvent.id);

    return new Response(
      JSON.stringify({
        success: true,
        event: statusEvent,
        message: "Status updated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating lot status:", error);
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

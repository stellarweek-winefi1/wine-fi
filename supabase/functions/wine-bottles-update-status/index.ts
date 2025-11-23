// Edge function to update individual bottle status
// Tracks bottle journey through supply chain
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  BOTTLE_STATUS,
  BottleStatus,
  corsHeaders,
  handleCORS,
  SCAN_TYPE,
  ScanType,
} from "../_shared/utils.ts";

interface BottleStatusUpdateRequest {
  bottle_id: string;
  status: BottleStatus;
  location?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  handler_name?: string;
  scan_type?: ScanType;
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
    const body: BottleStatusUpdateRequest = await req.json();
    const {
      bottle_id,
      status,
      location,
      location_coordinates,
      handler_name,
      scan_type,
      notes,
      metadata = {},
    } = body;

    // Validate input
    if (!bottle_id || !status) {
      return new Response(
        JSON.stringify({ error: "bottle_id and status are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate status value
    const validStatuses = Object.values(BOTTLE_STATUS);
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

    // Validate scan_type if provided
    if (scan_type) {
      const validScanTypes = Object.values(SCAN_TYPE);
      if (!validScanTypes.includes(scan_type)) {
        return new Response(
          JSON.stringify({
            error: `Invalid scan_type. Must be one of: ${validScanTypes.join(", ")}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Get bottle information
    const { data: bottleData, error: bottleError } = await supabase
      .from("wine_bottles")
      .select("id, token_id, bottle_number, current_status")
      .eq("id", bottle_id)
      .single();

    if (bottleError || !bottleData) {
      return new Response(
        JSON.stringify({ error: "Bottle not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get token to check admin permissions
    const { data: tokenData, error: tokenError } = await supabase
      .from("wine_tokens")
      .select("admin_wallet_id")
      .eq("id", bottleData.token_id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Associated wine token not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if user owns the admin wallet (or allow consumer scans for certain status types)
    const isConsumerScan = scan_type === "consumer_scan" ||
      scan_type === "verification";

    if (!isConsumerScan && tokenData.admin_wallet_id) {
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("user_id")
        .eq("id", tokenData.admin_wallet_id)
        .single();

      if (walletError || !walletData || walletData.user_id !== user.id) {
        return new Response(
          JSON.stringify({
            error:
              "Unauthorized: You must be the token admin or perform a consumer scan",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const previous_status = bottleData.current_status;

    // Optional blockchain proof (if bottle has NFT address)
    let transaction_hash = null;

    // Insert status event
    const { data: statusEvent, error: insertError } = await supabase
      .from("bottle_status_events")
      .insert({
        bottle_id,
        status,
        previous_status,
        transaction_hash,
        location,
        location_coordinates,
        handler_name: handler_name || user.email || "Unknown",
        handler_id: user.id,
        scan_type,
        notes,
        metadata,
        event_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting bottle status event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record bottle status update" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update QR code scan count if it's a scan event
    if (scan_type) {
      const { data: qrCode } = await supabase
        .from("bottle_qr_codes")
        .select("id, scan_count")
        .eq("bottle_id", bottle_id)
        .single();

      if (qrCode) {
        await supabase
          .from("bottle_qr_codes")
          .update({
            scan_count: (qrCode.scan_count || 0) + 1,
            last_scanned_at: new Date().toISOString(),
            last_scanned_by: user.id,
          })
          .eq("id", qrCode.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: statusEvent,
        message: "Bottle status updated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating bottle status:", error);
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


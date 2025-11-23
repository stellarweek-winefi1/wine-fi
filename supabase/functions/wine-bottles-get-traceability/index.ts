// Edge function to get complete bottle traceability
// Public endpoint for QR code scanning and bottle verification
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";

interface TraceabilityRequest {
  qr_code_hash?: string;
  qr_code?: string;
  bottle_id?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client (public access for transparency)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request - support both GET and POST
    let qr_code_hash: string | undefined;
    let qr_code: string | undefined;
    let bottle_id: string | undefined;

    if (req.method === "GET") {
      const url = new URL(req.url);
      qr_code_hash = url.searchParams.get("qr_code_hash") || undefined;
      qr_code = url.searchParams.get("qr_code") || undefined;
      bottle_id = url.searchParams.get("bottle_id") || undefined;
    } else if (req.method === "POST") {
      const body: TraceabilityRequest = await req.json();
      qr_code_hash = body.qr_code_hash;
      qr_code = body.qr_code;
      bottle_id = body.bottle_id;
    }

    // Need at least one identifier
    if (!qr_code_hash && !qr_code && !bottle_id) {
      return new Response(
        JSON.stringify({
          error: "Either qr_code_hash, qr_code, or bottle_id is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If QR code provided, look up the hash
    if (qr_code && !qr_code_hash) {
      const { data: qrData, error: qrError } = await supabase
        .from("bottle_qr_codes")
        .select("qr_code_hash, bottle_id")
        .eq("qr_code", qr_code)
        .eq("is_active", true)
        .single();

      if (qrError || !qrData) {
        return new Response(
          JSON.stringify({ error: "QR code not found or inactive" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      qr_code_hash = qrData.qr_code_hash;
      bottle_id = qrData.bottle_id;
    }

    // If QR code hash provided, look up bottle_id
    if (qr_code_hash && !bottle_id) {
      const { data: bottleData, error: bottleError } = await supabase
        .from("wine_bottles")
        .select("id")
        .eq("qr_code_hash", qr_code_hash)
        .single();

      if (bottleError || !bottleData) {
        return new Response(
          JSON.stringify({ error: "Bottle not found for QR code" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      bottle_id = bottleData.id;
    }

    // Get complete traceability from view
    const { data: traceability, error: traceError } = await supabase
      .from("bottle_traceability")
      .select("*")
      .eq("bottle_id", bottle_id)
      .single();

    if (traceError || !traceability) {
      return new Response(
        JSON.stringify({ error: "Bottle traceability not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get QR code information
    const { data: qrCodeInfo } = await supabase
      .from("bottle_qr_codes")
      .select("qr_code, scan_count, last_scanned_at")
      .eq("bottle_id", bottle_id)
      .single();

    // Build response
    const response = {
      bottle: {
        id: traceability.bottle_id,
        number: traceability.bottle_number,
        qr_code_hash: traceability.qr_code_hash,
        current_status: traceability.current_status,
        current_location: traceability.current_location,
        nft_address: traceability.nft_address,
      },
      wine: {
        id: traceability.token_id,
        name: traceability.wine_name,
        symbol: traceability.wine_symbol,
        metadata: traceability.wine_metadata,
      },
      qr_code: qrCodeInfo
        ? {
          code: qrCodeInfo.qr_code,
          scan_count: qrCodeInfo.scan_count,
          last_scanned_at: qrCodeInfo.last_scanned_at,
        }
        : null,
      bottle_history: traceability.status_history || [],
      lot_history: traceability.lot_history || [],
      authenticity: {
        verified: true,
        blockchain_proof: traceability.nft_address !== null,
        total_events: (traceability.status_history?.length || 0) +
          (traceability.lot_history?.length || 0),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching bottle traceability:", error);
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


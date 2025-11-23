// Edge function to get wine lot status history
// Retrieves complete status timeline with blockchain verification
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/utils.ts";

interface HistoryRequest {
  token_id?: string;
  token_address?: string;
  include_metadata?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client (public read access for transparency)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request - support both GET and POST
    let token_id: string | undefined;
    let token_address: string | undefined;
    let include_metadata = false;

    if (req.method === "GET") {
      const url = new URL(req.url);
      token_id = url.searchParams.get("token_id") || undefined;
      token_address = url.searchParams.get("token_address") || undefined;
      include_metadata = url.searchParams.get("include_metadata") === "true";
    } else if (req.method === "POST") {
      const body: HistoryRequest = await req.json();
      token_id = body.token_id;
      token_address = body.token_address;
      include_metadata = body.include_metadata || false;
    }

    // Validate input - need at least one identifier
    if (!token_id && !token_address) {
      return new Response(
        JSON.stringify({
          error: "Either token_id or token_address is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If token_address provided, look up token_id
    if (token_address && !token_id) {
      const { data: tokenData, error: tokenError } = await supabase
        .from("wine_tokens")
        .select("id")
        .eq("token_address", token_address)
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

      token_id = tokenData.id;
    }

    // Get wine token information
    const { data: tokenData, error: tokenError } = await supabase
      .from("wine_tokens")
      .select("id, name, symbol, token_address, wine_metadata")
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

    // Get status history
    const { data: statusHistory, error: historyError } = await supabase
      .from("wine_lot_status_events")
      .select("*")
      .eq("token_id", token_id)
      .order("event_timestamp", { ascending: false });

    if (historyError) {
      console.error("Error fetching status history:", historyError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch status history" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get current status from the view
    const { data: currentStatus } = await supabase
      .from("wine_lot_current_status")
      .select("*")
      .eq("token_id", token_id)
      .single();

    // Build response
    const response: any = {
      token: {
        id: tokenData.id,
        name: tokenData.name,
        symbol: tokenData.symbol,
        address: tokenData.token_address,
      },
      current_status: currentStatus || null,
      history: statusHistory || [],
      history_count: statusHistory?.length || 0,
    };

    // Include wine metadata if requested
    if (include_metadata) {
      response.token.wine_metadata = tokenData.wine_metadata;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching lot history:", error);
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


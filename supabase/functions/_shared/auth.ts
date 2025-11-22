import { corsHeaders } from "./utils.ts";

export type AuthenticatedUser = {
  id: string;
  email?: string | null;
};

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function requireAuthUser(
  req: Request,
  supabase: any,
): Promise<AuthenticatedUser> {
  const token = extractBearerToken(req);
  if (!token) {
    throw new Response(
      JSON.stringify({ error: "Missing Authorization bearer token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Response(
      JSON.stringify({ error: "Invalid or expired session token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return { id: data.user.id, email: data.user.email };
}




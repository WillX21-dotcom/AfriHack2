// Supabase Edge Function: mock-provider
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { provider, accountNumber } = await req.json();
    return new Response(
      JSON.stringify({
        mock: true,
        provider: provider || "Allan Gray",
        accountNumber: accountNumber || "AG-849102",
        valuationDate: new Date().toISOString(),
        nav: 1250000.0,
        ytdReturn: "+11.4%",
        status: "in_force",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

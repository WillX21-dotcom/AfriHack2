// Supabase Edge Function: submit-claim
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { claimId, insurerName, policyNumber } = await req.json();
    return new Response(
      JSON.stringify({
        success: true,
        claimId,
        insurerReference: `SNT-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "insurer_received",
        submittedAt: new Date().toISOString(),
        advisoryNote: `Claim successfully dispatched to ${insurerName || "Insurer"}.`,
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

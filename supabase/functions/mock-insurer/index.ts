// Supabase Edge Function: mock-insurer
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { action, claimNumber } = await req.json();

    const handlers = [
      { name: "Sarah Van Der Merwe", phone: "+27 11 912 3401", email: "claims.handler@santam.mock" },
      { name: "Deon Coetzee", phone: "+27 11 912 3405", email: "d.coetzee@discovery.mock" },
      { name: "Ayanda Ndlovu", phone: "+27 11 912 3409", email: "a.ndlovu@oldmutual.mock" },
    ];
    const assignedHandler = handlers[Math.floor(Math.random() * handlers.length)];

    return new Response(
      JSON.stringify({
        mock: true,
        claimNumber,
        action: action || "assess",
        status: "assessment_complete",
        handler: assignedHandler,
        repairAuthorised: true,
        approvedAmount: 48500.0,
        assessorComments: "Structural inspection verified. Paint and bumper replacement authorised with approved panel beater.",
        timestamp: new Date().toISOString(),
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

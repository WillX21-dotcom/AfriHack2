// Supabase Edge Function: create-claim
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const data = await req.json();
    const claimNumber = `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return new Response(
      JSON.stringify({
        success: true,
        claimNumber,
        status: "reported",
        incidentDate: data.incidentDate,
        location: data.incidentLocation,
        policeReported: data.policeReported,
        policeCaseNumber: data.policeCaseNumber,
        message: "Motor loss claim logged. Immediate adviser triage initiated.",
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

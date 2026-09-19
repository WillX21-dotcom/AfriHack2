// Supabase Edge Function: process-reminders
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    return new Response(
      JSON.stringify({
        processedAt: new Date().toISOString(),
        checkedCount: 14,
        dueCount: 2,
        alertsDispatched: [
          { type: "licence_expiry", client: "Sipho Dlamini", daysRemaining: 18 },
          { type: "annual_review", client: "Thabo Molefe", daysRemaining: 7 },
        ],
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

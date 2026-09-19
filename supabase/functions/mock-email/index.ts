// Supabase Edge Function: mock-email
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { to, subject, template, variables } = await req.json();
    return new Response(
      JSON.stringify({
        mock: true,
        sent: true,
        messageId: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        to,
        subject,
        template,
        variables,
        loggedAt: new Date().toISOString(),
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

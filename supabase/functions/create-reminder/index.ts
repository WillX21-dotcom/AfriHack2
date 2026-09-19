// Supabase Edge Function: create-reminder
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { title, description, reminderDate, frequency, clientId } = await req.json();
    return new Response(
      JSON.stringify({
        success: true,
        reminderId: `REM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        title,
        reminderDate,
        frequency: frequency || "once",
        clientId,
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

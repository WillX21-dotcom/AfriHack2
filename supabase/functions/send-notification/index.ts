// Supabase Edge Function: send-notification
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userId, title, body, channel = "in_app" } = await req.json();
    return new Response(
      JSON.stringify({
        success: true,
        notificationId: `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId,
        title,
        body,
        channel,
        deliveredAt: new Date().toISOString(),
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

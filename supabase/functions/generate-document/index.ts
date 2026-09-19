// Supabase Edge Function: generate-document
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { documentType, clientId, title } = await req.json();
    return new Response(
      JSON.stringify({
        success: true,
        documentType: documentType || "financial_statement",
        title: title || "Royal Square Financial Portfolio Certificate",
        downloadUrl: `https://royal-square.mock-storage/client-documents/${clientId || "client"}/generated_${Date.now()}.pdf`,
        generatedAt: new Date().toISOString(),
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

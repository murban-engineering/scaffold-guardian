import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch live context from the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const [scaffoldsRes, sitesRes, maintenanceRes, quotationsRes] =
      await Promise.all([
        sb
          .from("scaffolds")
          .select("id, scaffold_type, status, quantity, description, part_number, weekly_rate, mass_per_item")
          .limit(100),
        sb
          .from("sites")
          .select("id, name, location, status, address")
          .limit(50),
        sb
          .from("maintenance_logs")
          .select("id, issue_description, priority, is_resolved, created_at, resolution")
          .order("created_at", { ascending: false })
          .limit(50),
        sb
          .from("hire_quotations")
          .select("id, quotation_number, company_name, site_name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

    // Build summary stats
    const scaffolds = scaffoldsRes.data ?? [];
    const sites = sitesRes.data ?? [];
    const logs = maintenanceRes.data ?? [];
    const quotations = quotationsRes.data ?? [];

    const totalQty = scaffolds.reduce((s, r) => s + (r.quantity ?? 0), 0);
    const byStatus: Record<string, number> = {};
    scaffolds.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + (r.quantity ?? 0);
    });

    const activeSites = sites.filter((s) => s.status === "active").length;
    const unresolvedLogs = logs.filter((l) => !l.is_resolved);

    const contextBlock = `
## Live Data Context (use this to answer questions)

### Inventory Summary
- Total scaffold items: ${totalQty}
- By status: ${JSON.stringify(byStatus)}
- Scaffold records (sample): ${JSON.stringify(scaffolds.slice(0, 20))}

### Sites (${sites.length} total, ${activeSites} active)
${JSON.stringify(sites.slice(0, 15))}

### Recent Maintenance Logs (${logs.length} loaded, ${unresolvedLogs.length} unresolved)
${JSON.stringify(logs.slice(0, 15))}

### Recent Hire Quotations (${quotations.length} loaded)
${JSON.stringify(quotations.slice(0, 10))}
`;

    const systemPrompt = `You are OTN Assistant, an AI helper for the OTN Scaffolding management system. You help users with questions about their scaffold inventory, construction sites, maintenance logs, hire quotations, and general operations.

Be concise, helpful, and professional. When referencing data, use specific numbers and details from the live context below. If data is not available, say so honestly.

${contextBlock}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

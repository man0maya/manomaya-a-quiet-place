import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if today's reflection exists
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from("daily_reflections")
      .select("*")
      .eq("date", today)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify(existing),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new daily reflection
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const themes = [
      "stillness", "presence", "gratitude", "letting go", "inner peace",
      "compassion", "wisdom", "acceptance", "mindfulness", "surrender",
      "love", "truth", "silence", "breath", "awareness", "simplicity",
      "patience", "healing", "light", "connection", "wholeness"
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const systemPrompt = `You are a spiritual guide creating a daily reflection for seekers. Your wisdom draws from Vedanta, Buddhism, Sufi poetry, and timeless Indian philosophy. Your voice is calm, poetic, and deeply contemplative.

Create a reflection on the theme of "${randomTheme}". Respond with:
1. A profound spiritual quote (1-2 sentences)
2. A gentle explanation (2-3 sentences)

Format:
QUOTE: [Your quote]
EXPLANATION: [Your explanation]

Be original. No clichés. Let wisdom flow like a gentle stream.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate today's spiritual reflection on: ${randomTheme}` },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate daily reflection");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const quoteMatch = content.match(/QUOTE:\s*(.+?)(?=EXPLANATION:|$)/s);
    const explanationMatch = content.match(/EXPLANATION:\s*(.+?)$/s);

    const quote = quoteMatch?.[1]?.trim() || "Each morning brings a new invitation to presence.";
    const explanation = explanationMatch?.[1]?.trim() || "The day awaits with infinite possibility for those who meet it with an open heart.";

    const { data: reflection, error } = await supabase
      .from("daily_reflections")
      .insert({ quote, explanation, date: today })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify(reflection),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

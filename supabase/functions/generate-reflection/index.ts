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
    const { userInput, sessionId } = await req.json();

    if (!userInput || typeof userInput !== "string") {
      return new Response(
        JSON.stringify({ error: "Please provide a word or sentence to reflect upon." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a spiritual guide rooted in Indian philosophical traditions—Vedanta, Buddhism, Sufi poetry, and timeless wisdom. Your voice is calm, poetic, and deeply reflective. You never offer generic motivation. Instead, you offer profound truth wrapped in gentle metaphor.

When given a word or phrase, you must respond with:
1. A philosophical/spiritual quote (1-2 sentences, deeply meaningful)
2. A short reflective explanation (2-3 sentences, expanding on the quote's wisdom)

Your tone is: deep, contemplative, gentle—like early morning mist over a sacred river.

Format your response EXACTLY as:
QUOTE: [Your spiritual quote here]
EXPLANATION: [Your reflective explanation here]

Never use clichés. Never be preachy. Let wisdom emerge naturally, like dawn.`;

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
          { role: "user", content: `Reflect upon: "${userInput}"` },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Taking a moment of stillness. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate reflection");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the response
    const quoteMatch = content.match(/QUOTE:\s*(.+?)(?=EXPLANATION:|$)/s);
    const explanationMatch = content.match(/EXPLANATION:\s*(.+?)$/s);

    const quote = quoteMatch?.[1]?.trim() || content.split('\n')[0]?.trim() || "In stillness, truth reveals itself.";
    const explanation = explanationMatch?.[1]?.trim() || content.split('\n').slice(1).join(' ').trim() || "The mind, when quiet, becomes a mirror for wisdom.";

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: reflection, error: dbError } = await supabase
      .from("ai_reflections")
      .insert({
        user_input: userInput,
        quote,
        explanation,
        session_id: sessionId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    return new Response(
      JSON.stringify({
        id: reflection?.id,
        quote,
        explanation,
        userInput,
        created_at: reflection?.created_at || new Date().toISOString(),
      }),
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

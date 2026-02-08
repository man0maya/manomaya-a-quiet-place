import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://manomaya.lovable.app",
  "https://id-preview--47e85661-7ea3-4c77-a792-6f9cd27fff13.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const MAX_INPUT_LENGTH = 500;

// Diverse philosophical traditions and angles to ensure variety
const perspectives = [
  "Vedantic non-duality and the nature of self",
  "Buddhist impermanence and the flow of existence",
  "Sufi poetry and divine love",
  "Zen simplicity and direct perception",
  "Taoist harmony with nature's rhythm",
  "Upanishadic inquiry into consciousness",
  "Bhakti devotion and surrender",
  "Stoic acceptance and inner freedom",
  "Advaita realization of oneness",
  "Yogic awareness and inner stillness",
  "Jain compassion and non-attachment",
  "Sikh unity and humble service",
  "Ancient Indian forest wisdom (Aranyaka)",
  "Rumi's mystical longing",
  "Kabir's paradoxical truth",
  "Thiruvalluvar's ethical wisdom",
  "Basavanna's devotional equality",
];

const toneVariations = [
  "like a whisper at dawn, barely audible yet deeply resonant",
  "like moonlight on still water, soft and illuminating",
  "like an ancient tree's roots, grounded and unhurried",
  "like incense smoke rising in a quiet temple",
  "like the first raindrop on parched earth",
  "like the space between two breaths",
  "like a river meeting the sea, surrendering its name",
  "like the silence after a temple bell",
];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

    const sanitizedInput = userInput.trim();

    if (sanitizedInput.length === 0) {
      return new Response(
        JSON.stringify({ error: "Input cannot be empty." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (sanitizedInput.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Input too long. Please limit to ${MAX_INPUT_LENGTH} characters.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Select random perspective and tone for variety
    const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
    const tone = toneVariations[Math.floor(Math.random() * toneVariations.length)];
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);

    const systemPrompt = `You are a spiritual guide rooted in Indian philosophical traditions—Vedanta, Buddhism, Sufi poetry, and timeless wisdom. Your voice is calm, poetic, and deeply reflective. You never offer generic motivation. Instead, you offer profound truth wrapped in gentle metaphor.

For this reflection, draw specifically from the tradition of ${perspective}. 
Let your tone be ${tone}.

When given a word or phrase, you must respond with:
1. A philosophical/spiritual quote (1-2 sentences, deeply meaningful, COMPLETELY ORIGINAL and UNIQUE)
2. A short reflective explanation (2-3 sentences, expanding on the quote's wisdom)

CRITICAL: Each response must be entirely fresh and different. Never repeat patterns. Surprise the seeker with unexpected depth. Create something that has never been written before.

Format your response EXACTLY as:
QUOTE: [Your spiritual quote here]
EXPLANATION: [Your reflective explanation here]

Never use clichés. Never be preachy. Let wisdom emerge naturally, like dawn. Variation seed: ${randomSeed}-${timestamp}`;

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
          { role: "user", content: `Reflect upon this through the lens of ${perspective}: "${sanitizedInput}" (unique reflection #${randomSeed})` },
        ],
        temperature: 0.95,
        max_tokens: 500,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Taking a moment of stillness. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        user_input: sanitizedInput,
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
        userInput: sanitizedInput,
        created_at: reflection?.created_at || new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

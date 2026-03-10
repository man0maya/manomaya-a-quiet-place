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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter || 3600),
          } 
        }
      );
    }

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

    // --- Date-seeded unique theme selection ---
    // Each day maps deterministically to a unique theme + tradition + angle combo
    const themes = [
      "stillness", "presence", "gratitude", "letting go", "inner peace",
      "compassion", "wisdom", "acceptance", "mindfulness", "surrender",
      "love", "truth", "silence", "breath", "awareness", "simplicity",
      "patience", "healing", "light", "connection", "wholeness",
      "impermanence", "detachment", "selflessness", "devotion", "equanimity",
      "karma", "dharma", "moksha", "samsara", "maya (illusion)",
      "the witness", "non-duality", "emptiness", "the sacred ordinary",
      "the river of time", "the still point", "the inner flame",
      "the space between thoughts", "the art of being",
      "the courage of vulnerability", "the mystery of death",
      "the gift of suffering", "the seed of intention", "the mirror of self",
      "the language of the heart", "the dance of opposites",
      "forgiveness", "humility", "wonder", "solitude", "grace",
      "the beginner's mind", "sacred listening", "the body as temple",
      "the dream and the dreamer", "waking up", "the pathless path"
    ];

    const traditions = [
      "Advaita Vedanta (non-dual Hindu philosophy)",
      "Zen Buddhism (Japanese contemplative tradition)",
      "Sufi mysticism (Islamic inner wisdom)",
      "Taoism (the Way, wu wei, naturalness)",
      "Theravada Buddhism (Pali canon, vipassana)",
      "Bhakti tradition (devotional path of love)",
      "Stoic philosophy (Epictetus, Marcus Aurelius)",
      "Tibetan Buddhism (Dzogchen, Mahamudra)",
      "Kashmir Shaivism (Shiva-consciousness)",
      "Christian mysticism (Meister Eckhart, St. John of the Cross)",
      "Indigenous wisdom (animism, sacred interconnection)",
      "Upanishadic wisdom (Isha, Kena, Mandukya)",
      "Jain philosophy (ahimsa, anekantavada)",
      "Yogic philosophy (Patanjali's Yoga Sutras)",
      "Sikh wisdom (Guru Granth Sahib)",
    ];

    const angles = [
      "as experienced during a quiet morning walk",
      "through the metaphor of water and rivers",
      "as whispered by an ancient tree to a child",
      "from the perspective of a monk's last teaching",
      "as felt during the transition from night to dawn",
      "through the lens of a single breath",
      "as understood by someone who has lost everything",
      "from the silence after a storm",
      "through the eyes of a gardener tending soil",
      "as a letter written to one's future self",
      "from the stillness of a mountain peak",
      "through the metaphor of fire and transformation",
      "as a conversation between the moon and the sea",
      "from the perspective of returning home after years",
      "as observed in the flight pattern of birds",
      "through the act of lighting a single lamp in darkness",
      "as a dying sage's final words to a student",
      "from the sound of rain on temple stones",
    ];

    // Use date string as seed for deterministic-but-unique daily selection
    const dateNum = parseInt(today.replace(/-/g, ''), 10);
    const themeIdx = dateNum % themes.length;
    const tradIdx = (dateNum * 7 + 13) % traditions.length;
    const angleIdx = (dateNum * 11 + 29) % angles.length;

    const selectedTheme = themes[themeIdx];
    const selectedTradition = traditions[tradIdx];
    const selectedAngle = angles[angleIdx];

    // Fetch last 5 reflections to avoid repetition
    const { data: recentReflections } = await supabase
      .from("daily_reflections")
      .select("quote")
      .order("date", { ascending: false })
      .limit(5);

    const avoidList = recentReflections?.map(r => r.quote.substring(0, 60)).join(" | ") || "";

    const systemPrompt = `You are a spiritual poet and philosopher creating a unique daily reflection for Manomaya — a sacred digital space for inner peace, self-discovery, and consciousness exploration. The tone is deeply contemplative, poetic, Indian-rooted but universally human. Never generic, never motivational-poster style. Every word should feel like it was carved in temple stone.

Today's unique parameters:
- Theme: "${selectedTheme}"
- Philosophical tradition: ${selectedTradition}
- Creative angle: ${selectedAngle}
- Date: ${today} (use this as symbolic context — the season, the day number, the feeling of this moment in time)

STRICT RULES:
- The quote MUST be completely original — never paraphrase famous quotes
- Do NOT use these overused phrases: "journey within", "embrace the moment", "find your truth", "inner light shines", "let go and let flow"
- The quote should feel like it was discovered, not manufactured
- Draw from the specific tradition mentioned — use its unique vocabulary and metaphors
- The explanation should deepen the quote, not just restate it
- Avoid starting with "In the..." or "The path of..."
- The reflection must feel DIFFERENT from these recent ones: [${avoidList}]

Format strictly as:
QUOTE: [A profound, original 1-2 sentence spiritual insight]
EXPLANATION: [A 2-3 sentence contemplation that deepens the quote with specific philosophical context]`;

    const userMessage = `Create today's reflection (${today}) exploring "${selectedTheme}" through the lens of ${selectedTradition}, ${selectedAngle}. Make it utterly unique — something never said before.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.95,
        max_tokens: 600,
        seed: dateNum,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

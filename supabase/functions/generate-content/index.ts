import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "quote") {
      systemPrompt = `You are a spiritual wisdom curator. Generate a single profound, inspirational quote about mindfulness, stillness, inner peace, spirituality, or self-reflection. The quote should feel timeless and meaningful.

Your response must be valid JSON with this exact structure:
{
  "text": "The quote text here",
  "author": "Author Name or 'Anonymous' or a spiritual tradition"
}

Choose from various spiritual traditions: Buddhist, Hindu, Sufi, Zen, Taoist, or Western philosophical/spiritual figures. You can also create original quotes attributed to "Manomaya" for unique wisdom.`;
      userPrompt = "Generate a new inspirational quote about stillness, mindfulness, or spiritual wisdom.";
    } else if (type === "story") {
      systemPrompt = `You are a contemplative writer creating short spiritual reflections. Write a brief, poetic story or reflection about mindfulness, inner peace, nature, or spiritual awakening. The tone should be serene, thoughtful, and moving.

Your response must be valid JSON with this exact structure:
{
  "title": "A Poetic Title",
  "excerpt": "A 2-3 sentence preview of the story",
  "content": "The full story/reflection in 3-5 paragraphs. Use poetic, contemplative language.",
  "date": "Current month and year like 'January 2026'",
  "readTime": "X min read"
}`;
      userPrompt = "Generate a new contemplative story or reflection about stillness, nature, or spiritual awakening.";
    } else {
      throw new Error("Invalid type. Use 'quote' or 'story'.");
    }

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate content");
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse generated content");
    }
    
    const content = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ content, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-content function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

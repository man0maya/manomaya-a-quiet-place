import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute per IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://manomaya.lovable.app',
  'https://id-preview--47e85661-7ea3-4c77-a792-6f9cd27fff13.lovable.app'
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);
  
  // Clean up old entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [ip, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(ip);
      }
    }
  }
  
  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        error: "Too many requests. Please wait before generating more content.",
        retryAfter: rateLimitResult.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter)
        },
      });
    }

    // Validate request body size (max 1KB for this simple endpoint)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024) {
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type } = body;
    
    // Strict type validation
    if (!type || (type !== "quote" && type !== "story")) {
      return new Response(JSON.stringify({ error: "Invalid type. Use 'quote' or 'story'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase configuration is missing");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for inserting
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
  "readTime": "X min read"
}`;
      userPrompt = "Generate a new contemplative story or reflection about stillness, nature, or spiritual awakening.";
    }

    console.log(`Generating ${type} content for IP: ${clientIP}`);

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
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse AI response");
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const content = JSON.parse(jsonMatch[0]);
    console.log(`Generated ${type} successfully`);

    // Save to database
    if (type === "quote") {
      const { data: savedQuote, error: saveError } = await supabase
        .from("generated_quotes")
        .insert({
          text: content.text,
          author: content.author,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving quote:", saveError);
      } else {
        console.log("Quote saved successfully:", savedQuote.id);
        content.id = savedQuote.id;
        content.created_at = savedQuote.created_at;
      }
    } else if (type === "story") {
      const { data: savedStory, error: saveError } = await supabase
        .from("generated_stories")
        .insert({
          title: content.title,
          excerpt: content.excerpt,
          content: content.content,
          read_time: content.readTime || "5 min read",
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving story:", saveError);
      } else {
        console.log("Story saved successfully:", savedStory.id);
        content.id = savedStory.id;
        content.created_at = savedStory.created_at;
      }
    }

    return new Response(JSON.stringify({ content, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check how many images we already have today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayImages } = await supabase
      .from("generated_gallery_images")
      .select("id")
      .gte("created_at", todayStart.toISOString());

    if (todayImages && todayImages.length >= 4) {
      return new Response(
        JSON.stringify({ message: "Daily image limit reached", generated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick a unique theme using date + existing count as seed
    const themes = [
      "A golden lotus floating on misty temple waters at dawn, rays of warm light piercing through fog",
      "An ancient banyan tree with roots descending like curtains, a small oil lamp glowing beneath it at dusk",
      "A solitary meditating figure silhouetted against a vast orange-purple Himalayan sunset",
      "A sacred river ghats scene at dawn with floating flower offerings and rising incense smoke",
      "A moonlit zen rock garden with perfectly raked sand patterns and a single cherry blossom branch",
      "An ornate temple doorway framing a misty mountain valley, morning light streaming through",
      "Prayer flags fluttering across a high mountain pass with clouds flowing below",
      "A single candle flame reflected in still water inside a dark stone meditation cave",
      "An ancient stone Buddha statue half-covered by jungle vines with shafts of sunlight",
      "A peaceful courtyard garden with a small fountain, jasmine vines, and morning dew",
      "Sacred geometric mandala pattern drawn in colored sand on temple floor, overhead view",
      "A narrow forest path carpeted in fallen autumn leaves leading to a hidden shrine",
      "Incense spiral smoke rising in a dark temple hall with golden Buddha statues",
      "A mountain hermitage perched on a cliff edge above clouds at golden hour",
      "A tranquil koi pond with water lilies and a stone lantern covered in soft moss",
      "Hands cupped holding a small oil lamp with a warm flame, flower petals scattered around",
      "A misty bamboo grove at sunrise with sunbeams cutting through the tall stalks",
      "An ancient library of palm-leaf manuscripts in a monastery with warm candlelight",
      "A sacred waterfall in dense tropical forest with rainbow mist and fern-covered rocks",
      "A crescent moon over a vast desert with a lone traveler walking toward distant dunes",
      "Temple bells hanging in a row silhouetted against a fiery sunset sky",
      "A snow-covered stupa with prayer wheels and distant Himalayan peaks at blue hour",
      "A winding river through a valley of wildflowers with meditation stones along the bank",
      "A weathered wooden meditation bench under a massive spreading tree in golden afternoon light",
    ];

    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const offset = todayImages ? todayImages.length : 0;
    const themeIdx = (seed * 7 + offset * 13 + 29) % themes.length;
    const selectedTheme = themes[themeIdx];

    // Generate image via AI
    const prompt = `Create a breathtaking, photorealistic spiritual artwork: ${selectedTheme}. Style: contemplative, serene, rich warm tones with deep shadows, cinematic lighting, high detail. The mood should evoke inner peace and sacred stillness. No text or watermarks.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI image generation failed:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Image generation failed");
    }

    const data = await response.json();
    const imageBase64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const captionText = data.choices?.[0]?.message?.content || selectedTheme.split(",")[0];

    if (!imageBase64Url) {
      throw new Error("No image returned from AI");
    }

    // Extract base64 data and convert to bytes
    const base64Data = imageBase64Url.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const fileName = `spiritual-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("gallery-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("gallery-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Save to DB
    const caption = typeof captionText === "string" ? captionText.substring(0, 200) : selectedTheme.split(",")[0];
    const { data: saved, error: dbError } = await supabase
      .from("generated_gallery_images")
      .insert({
        image_url: publicUrl,
        caption: caption,
        theme: selectedTheme.substring(0, 100),
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ ...saved, generated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

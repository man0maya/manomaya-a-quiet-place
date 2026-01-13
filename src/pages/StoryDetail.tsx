import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  read_time: string;
  created_at: string;
}

// Static stories for the curated collection
const staticStories: Record<string, Story> = {
  "the-art-of-stillness": {
    id: "the-art-of-stillness",
    title: "The Art of Stillness",
    excerpt: "There is a quiet that lives between heartbeats. Not silence — that would be too simple. But a pause, deliberate and knowing, where the mind finally rests.",
    content: `There is a quiet that lives between heartbeats. Not silence — that would be too simple. But a pause, deliberate and knowing, where the mind finally rests.

We spend our days in motion, chasing the next moment before this one has finished arriving. We scroll through lives we'll never live, measuring our peace against the curated stillness of strangers.

But real stillness cannot be photographed. It happens in the spaces we don't share — in the early morning before the world demands our attention, in the breath we take before speaking, in the moment we choose not to fill with noise.

The art is not in achieving stillness. It is in remembering that we already contain it.

Every thought that rises will also fall. Every worry that grips us will eventually release. The still point at our center remains unchanged by the storms that pass through us.

To practice stillness is not to escape life, but to meet it more fully. When we pause, we notice. When we notice, we understand. When we understand, we can finally respond rather than react.

Today, try this: Stop reading. Close your eyes. Feel the weight of your body exactly where it is. Notice one breath, from beginning to end.

That moment? That was stillness. It was there all along.`,
    read_time: "5 min read",
    created_at: "2026-01-15T10:00:00Z",
  },
  "letters-to-the-morning": {
    id: "letters-to-the-morning",
    title: "Letters to the Morning",
    excerpt: "Each dawn arrives without announcement, expecting nothing in return. Perhaps that is why it feels so holy — this light that asks for nothing but presence.",
    content: `Each dawn arrives without announcement, expecting nothing in return. Perhaps that is why it feels so holy — this light that asks for nothing but presence.

I have begun writing letters to the morning. Not with pen and paper, but with attention. Each day I wake before my obligations, before the world tells me who I need to be, and I simply witness.

The sky never repeats itself. Yesterday's orange is not today's. The silence between birdsongs holds different weight in January than in July. These are the things we miss when we rush toward productivity.

The morning does not judge how I spent yesterday. It offers the same gentle light to the anxious and the peaceful, the broken and the whole. There is democracy in dawn — everyone receives the same invitation to begin again.

What would change if we treated each morning as a letter written specifically to us? An envelope of light, sealed with dew, containing a message we can only read if we're willing to be still enough to receive it.

I don't always understand what the morning is trying to tell me. Sometimes it speaks in colors I have no words for, in feelings that dissolve before I can name them. But I've stopped needing to understand.

The morning's gift is not information. It is presence. It reminds me that the world is older and wiser than my worries, that light will always return after darkness, that I am not alone in my waking.

Tomorrow, try writing back. Stand at your window before looking at your phone. Let your eyes be the first to open to the day, not your inbox. Notice one beautiful thing — just one — and let that be your response to the morning's letter.

You might be surprised by what you find yourself saying.`,
    read_time: "4 min read",
    created_at: "2025-12-20T09:00:00Z",
  },
  "the-weight-of-gentle-things": {
    id: "the-weight-of-gentle-things",
    title: "The Weight of Gentle Things",
    excerpt: "A leaf falls. A breath releases. A thought dissolves before it fully forms. These weightless moments carry more than we know.",
    content: `A leaf falls. A breath releases. A thought dissolves before it fully forms. These weightless moments carry more than we know.

We have been taught to value force. Push harder. Work faster. Make your presence known. But the most profound changes in our lives often arrive on soft feet, barely announcing themselves.

Consider how water shapes stone — not through violence, but through patience. Consider how a child's trust is earned — not through demands, but through consistent gentleness. Consider how healing happens — not in the dramatic breakthrough, but in the quiet accumulation of ordinary days.

The weight of gentle things is measured differently. Not in pounds or pressure, but in the way they settle into us and remain. A kind word spoken years ago that still warms us. A hand on our shoulder when we needed it most. The peace of a room after everyone has left but the love remains.

I used to mistake loudness for importance. Now I understand that the gentlest things often carry the greatest weight — precisely because they don't demand our attention. They earn it.

Gentleness is not weakness. It requires more strength to respond softly than to react harshly. It takes more courage to be vulnerable than to be guarded. The gentle warrior knows that some battles are won by not fighting.

Today, practice noticing the gentle things. The way light moves across your floor. The sound of your own breath when you're not trying to be anywhere else. The small kindnesses people offer without expectation.

These things may seem weightless. But stack enough of them together, and they become the foundation of a meaningful life.

Let yourself be shaped by gentleness. Let the soft things carry you.`,
    read_time: "6 min read",
    created_at: "2025-11-10T11:00:00Z",
  },
};

const StoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // Check static stories first
      if (staticStories[id]) {
        setStory(staticStories[id]);
        setIsLoading(false);
        return;
      }

      // Check database for AI-generated stories
      const { data, error } = await supabase
        .from("generated_stories")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStory(data);
      }
      setIsLoading(false);
    };

    fetchStory();
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen section-teal">
        <Navigation />
        <div className="pt-32 pb-16 px-6 flex items-center justify-center">
          <div className="animate-pulse text-primary">Loading story...</div>
        </div>
      </main>
    );
  }

  if (notFound || !story) {
    return (
      <main className="min-h-screen section-teal">
        <Navigation />
        <div className="pt-32 pb-16 px-6 text-center">
          <h1 className="text-4xl font-serif text-foreground mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-8">The story you're looking for doesn't exist.</p>
          <Link to="/stories" className="text-primary hover:underline">
            ← Back to Stories
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const isAIGenerated = !staticStories[id || ""];

  return (
    <>
      <SEOHead
        title={`${story.title} | Spiritual Story`}
        description={story.excerpt}
        keywords="spiritual story, contemplative writing, mindfulness, meditation, inner peace"
        canonicalUrl={`https://manomaya.lovable.app/stories/${id}`}
        type="article"
      />
      <main className="min-h-screen section-teal">
        <Navigation />

        <article className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/stories"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              Back to Stories
            </Link>

            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {format(new Date(story.created_at), "MMMM d, yyyy")}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {story.read_time}
                </span>
                {isAIGenerated && (
                  <>
                    <span>•</span>
                    <span className="text-primary/60">✨ AI Generated</span>
                  </>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
                {story.title}
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed italic">
                {story.excerpt}
              </p>

              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-primary/10">
                {isAIGenerated && <LikeButton itemId={story.id} itemType="story" />}
                <ShareButton
                  title={story.title}
                  text={story.excerpt}
                  url={`https://manomaya.lovable.app/stories/${id}`}
                />
              </div>
            </motion.header>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none"
            >
              {story.content.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="text-foreground/90 leading-relaxed mb-6 text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </motion.div>

            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 pt-8 border-t border-primary/10"
            >
              <div className="flex items-center justify-between">
                <Link
                  to="/stories"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  ← More Stories
                </Link>
                <div className="flex items-center gap-6">
                  {isAIGenerated && <LikeButton itemId={story.id} itemType="story" />}
                  <ShareButton
                    title={story.title}
                    text={story.excerpt}
                    url={`https://manomaya.lovable.app/stories/${id}`}
                  />
                </div>
              </div>
            </motion.footer>
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
};

export default StoryDetail;

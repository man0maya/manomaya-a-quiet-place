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

import { staticStories } from "@/lib/static-content";

interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  read_time: string;
  created_at: string;
}

// Map the shared static content to the internal Story interface if needed
const staticStoriesMap: Record<string, Story> = {};
staticStories.forEach(s => {
  staticStoriesMap[s.id] = {
    id: s.id,
    title: s.title,
    excerpt: s.excerpt,
    content: s.content,
    read_time: s.readTime,
    created_at: s.created_at
  };
});

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
      if (staticStoriesMap[id]) {
        setStory(staticStoriesMap[id]);
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

  const isAIGenerated = !staticStoriesMap[id || ""];

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

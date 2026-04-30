import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/hooks/usePosts';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFavorited, toggleFavorite } = useFavorites();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as Post);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && notFound) {
      toast({ title: 'Post not found', description: 'Returning to blog.' });
      const t = setTimeout(() => navigate('/blog', { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [loading, notFound, navigate, toast]);

  if (loading) {
    return (
      <main className="min-h-screen section-teal">
        <Navigation />
        <div className="pt-40 px-6 text-center text-primary animate-pulse">Loading post...</div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen section-teal">
        <Navigation />
        <div className="pt-40 px-6 text-center">
          <h1 className="text-3xl font-serif text-foreground mb-3">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline">← Back to Blog</Link>
        </div>
      </main>
    );
  }

  const dateStr = post.published_at
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : format(new Date(post.created_at), 'MMM d, yyyy');

  const description = (post.excerpt?.trim() || stripHtml(post.content).slice(0, 160)).slice(0, 160);
  const url = `https://manomaya.lovable.app/blog/${post.id}`;
  const favorited = isFavorited(post.id);

  return (
    <>
      <SEOHead
        title={`${post.title} | Manomaya`}
        description={description}
        keywords={`${post.title}, manomaya, spiritual blog, contemplative writing, mindfulness, inner peace`}
        canonicalUrl={url}
        type="article"
        image={post.image_url || undefined}
        article={{
          publishedTime: post.published_at || post.created_at,
          modifiedTime: post.updated_at,
          author: 'manomaya',
        }}
      />
      <main className="min-h-screen section-teal">
        <Navigation />

        <article className="pt-28 pb-20 px-6">
          <div className="max-w-2xl mx-auto relative">
            {/* Back */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
            >
              <ArrowLeft size={14} />
              Back to Blog
            </Link>

            {/* Floating bookmark */}
            <button
              onClick={() => toggleFavorite(post.id, 'post')}
              aria-label={favorited ? 'Remove bookmark' : 'Bookmark this post'}
              className={`absolute top-12 right-0 p-2.5 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/30 transition-colors ${
                favorited ? 'text-primary' : 'text-primary/70 hover:text-primary'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </button>

            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <span className="text-[11px] uppercase tracking-[0.25em] text-primary/60 font-medium">
                Note
              </span>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mt-4 mb-5 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
                <span className="text-primary/80">manomaya</span>
                <span>·</span>
                <time dateTime={post.published_at || post.created_at}>{dateStr}</time>
              </div>
            </motion.header>

            {/* Hero image */}
            {post.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="rounded-2xl overflow-hidden mb-10 border border-primary/10 shadow-lg"
              >
                <img
                  src={post.image_url}
                  alt={post.title}
                  loading="eager"
                  decoding="async"
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            )}

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="prose-blog text-foreground/90 [&>p]:mb-5 [&>p]:leading-[1.85] [&>p]:text-[16px] [&>p]:text-justify [&>h2]:font-serif [&>h2]:text-2xl [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:font-serif [&>h3]:text-xl [&>h3]:mt-8 [&>h3]:mb-3 [&>blockquote]:border-l-2 [&>blockquote]:border-primary/40 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>strong]:text-foreground [&>strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />

            {/* Footer actions */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 pt-8 border-t border-primary/10 flex items-center justify-between gap-4 flex-wrap"
            >
              <Link
                to="/blog"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← More posts
              </Link>
              <div className="flex items-center gap-3">
                <LikeButton itemId={post.id} itemType="story" />
                <ShareButton title={post.title} text={description} url={url} />
              </div>
            </motion.footer>
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, Search, RefreshCw, PenTool } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePublicPosts, Post } from '@/hooks/usePosts';
import { useFavorites } from '@/hooks/useFavorites';
import { format } from 'date-fns';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function BlogCard({ post, index }: { post: Post; index: number }) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(post.id);

  const excerpt =
    post.excerpt?.trim() ||
    stripHtml(post.content).slice(0, 140) + (post.content.length > 140 ? '…' : '');

  const dateStr = post.published_at
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : format(new Date(post.created_at), 'MMM d, yyyy');

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4) }}
      className="group relative bg-card/30 hover:bg-card/50 border border-primary/10 hover:border-primary/20 rounded-2xl overflow-hidden transition-all duration-500"
    >
      <Link to={`/blog/${post.id}`} className="block">
        {post.image_url && (
          <div className="aspect-[16/9] overflow-hidden bg-primary/5">
            <img
              src={post.image_url}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary/60 font-medium">
            Note
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3 mb-3 leading-tight group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {excerpt && (
            <p className="text-muted-foreground/80 text-sm md:text-base leading-relaxed mb-5 line-clamp-2">
              {excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
            <time dateTime={post.published_at || post.created_at}>{dateStr}</time>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-primary/80 group-hover:text-primary transition-colors">
              Read more
              <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(post.id, 'post');
        }}
        aria-label={favorited ? 'Remove bookmark' : 'Bookmark this post'}
        className={`absolute top-4 right-4 p-2 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 transition-colors ${
          favorited ? 'text-primary' : 'text-muted-foreground/60 hover:text-primary'
        }`}
      >
        <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
      </button>
    </motion.article>
  );
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: posts = [], isLoading } = usePublicPosts();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        stripHtml(p.content).toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  return (
    <>
      <SEOHead
        title="Blog — Notes & Reflections by manomaya"
        description="Personal notes and deeply considered thoughts from manomaya. Spiritual reflections, contemplative essays, and quiet writing for the seeking soul."
        keywords="manomaya blog, spiritual blog, contemplative writing, mindfulness essays, spiritual reflections, author blog, inner peace"
        canonicalUrl="https://manomaya.lovable.app/blog"
      />
      <main className="min-h-screen section-teal">
        <Navigation />

        {/* Header */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <PenTool className="w-6 h-6 text-primary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif text-foreground mb-4"
            >
              Author Blog
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-muted-foreground text-base md:text-lg"
            >
              Personal notes and deeply considered thoughts
            </motion.p>
          </div>
        </section>

        {/* Search */}
        <section className="px-6 pb-10">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/40 border-primary/20"
                aria-label="Search blog posts"
              />
            </div>
          </div>
        </section>

        {/* List */}
        <section className="px-6 pb-24">
          <div className="max-w-2xl mx-auto space-y-8">
            {isLoading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-6 h-6 mx-auto text-primary animate-spin" />
                <p className="text-muted-foreground mt-4">Loading posts...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No posts found.' : 'No posts published yet.'}
                </p>
              </div>
            ) : (
              filtered.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, Search, RefreshCw, PenTool, Sparkles, BookOpen, Quote } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { usePublicPosts } from '@/hooks/usePosts';
import { useFavorites } from '@/hooks/useFavorites';
import { useGeneratedStories, usePublicReflections } from '@/hooks/useGeneratedContent';
import { staticStories } from '@/lib/static-content';
import { format } from 'date-fns';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type UnifiedItem = {
  id: string;
  type: 'post' | 'story' | 'reflection' | 'static';
  title: string;
  excerpt: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  published_at?: string | null;
  read_time?: string;
  author?: string;
};

function BlogCard({ item, index }: { item: UnifiedItem; index: number }) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(item.id);

  const dateStr = item.published_at
    ? format(new Date(item.published_at), 'MMM d, yyyy')
    : format(new Date(item.created_at), 'MMM d, yyyy');

  const typeLabel = {
    post: 'Note',
    story: 'AI Story',
    reflection: 'Reflection',
    static: 'Collection',
  }[item.type];

  const typeIcon = {
    post: <PenTool size={10} />,
    story: <Sparkles size={10} />,
    reflection: <Quote size={10} />,
    static: <BookOpen size={10} />,
  }[item.type];

  // Logic for the detail link
  const detailLink = item.type === 'reflection' ? null : `/blog/${item.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4) }}
      className="group relative bg-card/30 hover:bg-card/50 border border-primary/10 hover:border-primary/20 rounded-2xl overflow-hidden transition-all duration-500"
    >
      <div className="block">
        {item.image_url && (
          <div className="aspect-[16/9] overflow-hidden bg-primary/5">
            <img
              src={item.image_url}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-wider text-primary font-semibold">
              {typeIcon}
              {typeLabel}
            </span>
            {item.read_time && (
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                · {item.read_time}
              </span>
            )}
          </div>
          
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
            {detailLink ? <Link to={detailLink}>{item.title}</Link> : item.title}
          </h2>
          
          <p className="text-muted-foreground/80 text-sm md:text-base leading-relaxed mb-5 line-clamp-3 italic">
            {item.excerpt}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
            <time dateTime={item.created_at}>{dateStr}</time>
            {detailLink && (
              <>
                <span>·</span>
                <Link to={detailLink} className="inline-flex items-center gap-1 text-primary/80 group-hover:text-primary transition-colors">
                  Read more
                  <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(item.id, item.type === 'reflection' ? 'reflection' : 'post');
        }}
        aria-label={favorited ? 'Remove bookmark' : 'Bookmark this item'}
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
  
  const { data: posts = [], isLoading: postsLoading } = usePublicPosts();
  const { data: stories = [], isLoading: storiesLoading } = useGeneratedStories();
  const { data: reflections = [], isLoading: reflectionsLoading } = usePublicReflections();

  const unifiedItems = useMemo(() => {
    // Start with static stories
    const items: UnifiedItem[] = staticStories.map(s => ({
      id: s.id,
      type: 'static',
      title: s.title,
      excerpt: s.excerpt,
      content: s.content,
      created_at: s.created_at,
      read_time: s.readTime
    }));

    // Add DB posts
    posts.forEach(p => {
      items.push({
        id: p.id,
        type: 'post',
        title: p.title,
        excerpt: p.excerpt || stripHtml(p.content).slice(0, 160) + '...',
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        published_at: p.published_at
      });
    });

    // Add Stories
    stories.forEach((s: any) => {
      items.push({
        id: s.id,
        type: 'story',
        title: s.title,
        excerpt: s.excerpt,
        content: s.content,
        created_at: s.created_at,
        read_time: s.read_time
      });
    });

    // Add Reflections
    reflections.forEach((r: any) => {
      items.push({
        id: r.id,
        type: 'reflection',
        title: r.quote.length > 40 ? r.quote.slice(0, 40) + '...' : r.quote,
        excerpt: r.explanation,
        content: r.explanation,
        created_at: r.created_at
      });
    });

    // Sort: Newest first
    return items.sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });
  }, [posts, stories, reflections]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return unifiedItems;
    const q = searchQuery.toLowerCase();
    return unifiedItems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [unifiedItems, searchQuery]);

  const isLoading = postsLoading || storiesLoading || reflectionsLoading;

  return (
    <>
      <SEOHead
        title="Blog — Notes & Reflections by manomaya"
        description="A unified feed of spiritual reflections, contemplative essays, and quiet writing. Personal notes and AI-powered wisdom for the seeking soul."
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
              Poetic notes, long-form stories, and mindful reflections
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
                placeholder="Search everything..."
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
            {isLoading && unifiedItems.length === 0 ? (
              <div className="text-center py-16">
                <RefreshCw className="w-6 h-6 mx-auto text-primary animate-spin" />
                <p className="text-muted-foreground mt-4">Gathering reflections...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No results found.' : 'No items published yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {filtered.map((item, i) => (
                  <BlogCard key={`${item.type}-${item.id}`} item={item} index={i} />
                ))}
                {isLoading && (
                  <div className="text-center py-4">
                    <RefreshCw className="w-4 h-4 mx-auto text-primary animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}


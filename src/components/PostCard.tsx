import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Post } from '@/hooks/usePosts';
import { useFavorites } from '@/hooks/useFavorites';
import ShareButton from '@/components/ShareButton';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

interface PostCardProps {
  post: Post;
  index?: number;
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(post.id);

  const handleFavorite = () => {
    toggleFavorite(post.id, 'post');
  };

  const excerpt = post.excerpt || post.content.slice(0, 200) + '...';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="bg-card/40 border border-primary/5 rounded-xl overflow-hidden"
    >
      {post.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5 md:p-8">
        <div className="max-w-[700px] mx-auto">
          {/* Label */}
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium">
            Note
          </span>

          {/* Title */}
          <h2 className="font-serif text-xl md:text-2xl text-foreground mt-2 mb-3 leading-tight">
            {post.title}
          </h2>

          {/* Excerpt as summary */}
          <p className="text-muted-foreground/70 italic text-sm md:text-base leading-relaxed mb-6">
            {excerpt}
          </p>

          {/* Body */}
          <div
            className="text-foreground/80 text-[15px] leading-[1.7] [&>p]:mb-3 [&>p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-primary/5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/50">manomaya</span>
              {post.published_at && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground/40">
                    {format(new Date(post.published_at), 'MMM d, yyyy')}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavorite}
                className={`h-7 w-7 ${favorited ? 'text-red-500' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
              </Button>
              <ShareButton
                title={post.title}
                text={excerpt}
                url={`https://manomaya.lovable.app/notes/${post.id}`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

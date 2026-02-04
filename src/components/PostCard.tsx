import { motion } from 'framer-motion';
import { Heart, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Post } from '@/hooks/usePosts';
import { useFavorites } from '@/hooks/useFavorites';
import ShareButton from '@/components/ShareButton';
import { format } from 'date-fns';

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gradient-to-br from-card/80 to-card/50 border border-primary/10 rounded-xl overflow-hidden"
    >
      {post.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mb-4">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            manomaya
          </span>
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(post.published_at), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-serif text-foreground mb-4 leading-tight">
          {post.title}
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-6">
          {excerpt}
        </p>

        <div 
          className="prose prose-sm prose-invert max-w-none mb-6 text-foreground/80"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="flex items-center justify-between border-t border-primary/10 pt-4">
          <span className="text-sm font-medium text-primary">— manomaya</span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              className={`h-8 w-8 ${favorited ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </Button>
            <ShareButton
              title={post.title}
              text={excerpt}
              url={`https://manomaya.lovable.app/notes/${post.id}`}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

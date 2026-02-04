import { motion } from 'framer-motion';
import { Heart, Share2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIReflection } from '@/hooks/useReflections';
import { useFavorites } from '@/hooks/useFavorites';
import ShareButton from '@/components/ShareButton';
import { format } from 'date-fns';

interface ReflectionCardProps {
  reflection: AIReflection;
  index?: number;
}

export default function ReflectionCard({ reflection, index = 0 }: ReflectionCardProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(reflection.id);

  const handleFavorite = () => {
    toggleFavorite(reflection.id, 'reflection');
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gradient-to-br from-card/80 to-card/50 border border-primary/10 rounded-xl p-6 md:p-8"
    >
      {reflection.user_input && (
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground/60">
            Reflecting on
          </span>
          <p className="text-sm text-primary/80 italic">"{reflection.user_input}"</p>
        </div>
      )}

      <div className="relative mb-6">
        <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/20" />
        <blockquote className="font-serif text-xl md:text-2xl text-foreground leading-relaxed pl-6">
          {reflection.quote}
        </blockquote>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-6 pl-6">
        {reflection.explanation}
      </p>

      <div className="flex items-center justify-between border-t border-primary/10 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">— manomaya</span>
          {reflection.created_at && (
            <span className="text-xs text-muted-foreground/60">
              · {format(new Date(reflection.created_at), 'MMM d, yyyy')}
            </span>
          )}
        </div>

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
            title="Reflection by manomaya"
            text={`${reflection.quote}\n\n${reflection.explanation}`}
            url={`https://manomaya.lovable.app/reflections#${reflection.id}`}
          />
        </div>
      </div>
    </motion.article>
  );
}

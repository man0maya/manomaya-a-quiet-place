import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
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

  const title = reflection.user_input
    ? reflection.user_input
    : 'A Moment of Stillness';

  const paragraphs = reflection.explanation
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="bg-card/40 border border-primary/5 rounded-xl p-5 md:p-8"
    >
      <div className="max-w-[700px] mx-auto">
        {/* Label */}
        <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium">
          Reflection
        </span>

        {/* Title */}
        <h2 className="font-serif text-xl md:text-2xl text-foreground mt-2 mb-3 leading-tight">
          {title}
        </h2>

        {/* Quote as summary */}
        <p className="text-muted-foreground/70 italic text-sm md:text-base leading-relaxed mb-6">
          "{reflection.quote}"
        </p>

        {/* Body paragraphs */}
        <div className="space-y-3">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-foreground/80 text-[15px] leading-[1.7]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-primary/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/50">manomaya</span>
            {reflection.created_at && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground/40">
                  {format(new Date(reflection.created_at), 'MMM d, yyyy')}
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
              title="Reflection by manomaya"
              text={`${reflection.quote}\n\n${reflection.explanation}`}
              url={`https://manomaya.lovable.app/reflections#${reflection.id}`}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

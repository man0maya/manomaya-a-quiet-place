import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun } from 'lucide-react';
import { useReflections } from '@/hooks/useReflections';
import ShareButton from '@/components/ShareButton';

export default function DailyReflection() {
  const { dailyReflection, fetchDailyReflection } = useReflections();

  useEffect(() => {
    fetchDailyReflection();
  }, [fetchDailyReflection]);

  if (!dailyReflection) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Sun className="w-8 h-8 mx-auto text-primary/40 animate-pulse" />
        <p className="text-muted-foreground mt-4 text-sm">Loading today's reflection...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary/60" />
        <span className="text-xs uppercase tracking-widest text-primary/60">
          Today's Reflection
        </span>
        <Sparkles className="w-5 h-5 text-primary/60" />
      </div>

      <blockquote className="font-serif text-2xl md:text-4xl text-foreground leading-relaxed mb-6 italic">
        "{dailyReflection.quote}"
      </blockquote>

      <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
        {dailyReflection.explanation}
      </p>

      <div className="flex items-center justify-center gap-4">
        <div className="divider-gold-solid w-8" />
        <span className="text-primary text-sm font-medium">— manomaya</span>
        <div className="divider-gold-solid w-8" />
      </div>

      <div className="mt-6">
        <ShareButton
          title="Daily Reflection by manomaya"
          text={`${dailyReflection.quote}\n\n${dailyReflection.explanation}`}
          url="https://manomaya.lovable.app"
        />
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReflections, AIReflection } from '@/hooks/useReflections';

interface ReflectionInputProps {
  onReflectionGenerated?: (reflection: AIReflection) => void;
}

export default function ReflectionInput({ onReflectionGenerated }: ReflectionInputProps) {
  const [input, setInput] = useState('');
  const { generateReflection, isGenerating } = useReflections();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const reflection = await generateReflection(input.trim());
    if (reflection) {
      setInput('');
      onReflectionGenerated?.(reflection);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 md:p-8"
    >
      <div className="text-center mb-6">
        <Sparkles className="w-8 h-8 mx-auto text-primary mb-3" />
        <h2 className="text-xl md:text-2xl font-serif text-foreground mb-2">
          AI Reflection Tool
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Enter a word or sentence, and receive a spiritual reflection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter a word or thought..."
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            maxLength={500}
            disabled={isGenerating}
            className="pr-12 h-12 text-base bg-background/50 border-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
          />
          {input.length > 400 && (
            <span className="absolute right-14 top-3.5 text-xs text-muted-foreground">
              {input.length}/500
            </span>
          )}
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isGenerating}
            className="absolute right-1 top-1 h-10 w-10 bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {isGenerating && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          Contemplating in stillness...
        </motion.p>
      )}
    </motion.div>
  );
}

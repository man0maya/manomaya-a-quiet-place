import { motion } from "framer-motion";

const FeaturedQuote = () => {
  return (
    <section className="section-teal py-24 md:py-32 px-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-primary/50 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-primary/30 rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Decorative element */}
          <div className="lotus-decoration mb-8" />

          {/* Quote */}
          <blockquote className="font-serif text-3xl md:text-5xl text-foreground leading-relaxed italic mb-8">
            "The soul always knows what to do to heal itself. 
            The challenge is to silence the mind."
          </blockquote>

          {/* Attribution */}
          <div className="flex items-center justify-center gap-4">
            <div className="divider-gold-solid w-12" />
            <cite className="text-primary not-italic tracking-wide">
              Caroline Myss
            </cite>
            <div className="divider-gold-solid w-12" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedQuote;

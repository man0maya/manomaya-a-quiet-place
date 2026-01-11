import { motion } from "framer-motion";

interface WritingCardProps {
  title: string;
  excerpt: string;
  date: string;
  index: number;
}

const WritingCard = ({ title, excerpt, date, index }: WritingCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.15,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="group cursor-pointer"
    >
      <div className="border-t border-gold/20 pt-8 pb-12 transition-all duration-500 group-hover:border-gold/40">
        <time className="text-sm tracking-widest-xl uppercase text-muted-foreground font-sans">
          {date}
        </time>
        
        <h3 className="mt-4 text-2xl md:text-3xl font-serif text-foreground group-hover:text-primary transition-colors duration-500">
          {title}
        </h3>
        
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl font-light">
          {excerpt}
        </p>
        
        <div className="mt-6 flex items-center gap-2 text-primary/70 group-hover:text-primary transition-colors duration-500">
          <span className="text-sm tracking-wide font-sans">Read</span>
          <motion.span
            className="inline-block"
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
          >
            →
          </motion.span>
        </div>
      </div>
    </motion.article>
  );
};

export default WritingCard;

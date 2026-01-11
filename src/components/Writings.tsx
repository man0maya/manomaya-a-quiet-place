import { motion } from "framer-motion";
import WritingCard from "./WritingCard";

const writings = [
  {
    title: "On the Art of Stillness",
    excerpt: "There is a quiet that lives between heartbeats. Not silence — that would be too simple. But a pause, deliberate and knowing, where the mind finally rests.",
    date: "January 2026",
  },
  {
    title: "Letters to the Morning",
    excerpt: "Each dawn arrives without announcement, expecting nothing in return. Perhaps that is why it feels so holy — this light that asks for nothing but presence.",
    date: "December 2025",
  },
  {
    title: "The Weight of Gentle Things",
    excerpt: "A leaf falls. A breath releases. A thought dissolves before it fully forms. These weightless moments carry more than we know.",
    date: "November 2025",
  },
];

const Writings = () => {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-sm tracking-widest-xl text-primary uppercase font-sans">
            Writings
          </h2>
        </motion.div>

        {/* Writing cards */}
        <div className="space-y-2">
          {writings.map((writing, index) => (
            <WritingCard
              key={writing.title}
              title={writing.title}
              excerpt={writing.excerpt}
              date={writing.date}
              index={index}
            />
          ))}
        </div>

        {/* Bottom divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-8 border-t border-gold/20"
        />
      </div>
    </section>
  );
};

export default Writings;

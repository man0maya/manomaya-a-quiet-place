import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const quotes = [
  {
    text: "The soul always knows what to do to heal itself. The challenge is to silence the mind.",
    author: "Caroline Myss",
  },
  {
    text: "In the midst of movement and chaos, keep stillness inside of you.",
    author: "Deepak Chopra",
  },
  {
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh",
  },
  {
    text: "Silence is the sleep that nourishes wisdom.",
    author: "Francis Bacon",
  },
  {
    text: "Within you there is a stillness and a sanctuary to which you can retreat at any time.",
    author: "Hermann Hesse",
  },
  {
    text: "The quieter you become, the more you can hear.",
    author: "Ram Dass",
  },
  {
    text: "Be like a tree and let the dead leaves drop.",
    author: "Rumi",
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    author: "Lao Tzu",
  },
];

const Quotes = () => {
  return (
    <main className="min-h-screen section-teal">
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl mb-6 block"
          >
            🪷
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif text-foreground mb-6"
          >
            Quotes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-muted-foreground text-lg"
          >
            One thought at a time. One pause at a time.
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="divider-gold w-24 mx-auto mt-8"
          />
        </div>
      </section>

      {/* Quotes List */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-12">
          {quotes.map((quote, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.05 }}
              className="text-center"
            >
              <blockquote className="font-serif text-2xl md:text-3xl text-primary leading-relaxed italic mb-6">
                "{quote.text}"
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="divider-gold-solid w-8" />
                <cite className="text-muted-foreground not-italic text-sm tracking-wide">
                  {quote.author}
                </cite>
                <div className="divider-gold-solid w-8" />
              </div>
              {index < quotes.length - 1 && (
                <div className="mt-12 lotus-decoration" />
              )}
            </motion.article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Quotes;

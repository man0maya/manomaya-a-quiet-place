import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const stories = [
  {
    id: "the-art-of-stillness",
    title: "The Art of Stillness",
    excerpt: "There is a quiet that lives between heartbeats. Not silence — that would be too simple. But a pause, deliberate and knowing, where the mind finally rests.",
    date: "January 2026",
    readTime: "5 min read",
  },
  {
    id: "letters-to-the-morning",
    title: "Letters to the Morning",
    excerpt: "Each dawn arrives without announcement, expecting nothing in return. Perhaps that is why it feels so holy — this light that asks for nothing but presence.",
    date: "December 2025",
    readTime: "4 min read",
  },
  {
    id: "the-weight-of-gentle-things",
    title: "The Weight of Gentle Things",
    excerpt: "A leaf falls. A breath releases. A thought dissolves before it fully forms. These weightless moments carry more than we know.",
    date: "November 2025",
    readTime: "6 min read",
  },
];

const Stories = () => {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Header - Teal section */}
      <section className="section-teal pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl mb-6 block"
          >
            📖
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif text-foreground mb-6"
          >
            Stories
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-muted-foreground text-lg"
          >
            Longer reflections for deeper reading
          </motion.p>
        </div>
      </section>

      {/* Stories List - Cream section */}
      <section className="section-cream py-24 px-6">
        <div className="max-w-3xl mx-auto">
          {stories.map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              className="group mb-16 last:mb-0"
            >
              <Link to={`/stories/${story.id}`} className="block">
                <div className="border-t border-teal-deep/20 pt-8">
                  <div className="flex items-center gap-4 mb-4 text-sm text-soft-gray">
                    <time>{story.date}</time>
                    <span>•</span>
                    <span>{story.readTime}</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif text-teal-deep group-hover:text-primary transition-colors duration-500 mb-4">
                    {story.title}
                  </h2>
                  
                  <p className="text-soft-gray leading-relaxed mb-6 reading-width">
                    {story.excerpt}
                  </p>
                  
                  <span className="inline-flex items-center gap-2 text-sm text-teal-deep/70 group-hover:text-primary transition-colors duration-300">
                    Read story
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Stories;

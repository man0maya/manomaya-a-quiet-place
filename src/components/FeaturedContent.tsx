import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const sections = [
  {
    title: "Gallery",
    description: "Visual meditations for quiet reflection",
    link: "/gallery",
    icon: "🖼",
  },
  {
    title: "Quotes",
    description: "Timeless wisdom, one thought at a time",
    link: "/quotes",
    icon: "🪷",
  },
  {
    title: "Stories",
    description: "Longer reflections for deeper reading",
    link: "/stories",
    icon: "📖",
  },
];

const FeaturedContent = () => {
  return (
    <section className="section-cream py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-teal-deep mb-4">
            Explore the Stillness
          </h2>
          <p className="text-soft-gray max-w-xl mx-auto">
            Content meant to be timeless, searchable, and emotionally grounding.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <Link
                to={section.link}
                className="block group h-full"
              >
                <div className="h-full p-8 md:p-10 bg-cream border border-teal-deep/10 rounded-lg transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1">
                  <span className="text-4xl mb-6 block">{section.icon}</span>
                  <h3 className="text-2xl font-serif text-teal-deep mb-3 group-hover:text-primary transition-colors duration-300">
                    {section.title}
                  </h3>
                  <p className="text-soft-gray mb-6 leading-relaxed">
                    {section.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm text-teal-deep/70 group-hover:text-primary transition-colors duration-300">
                    Explore
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedContent;

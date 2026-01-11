import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import manomayaLogo from "@/assets/manomaya-logo.jpg";

const About = () => {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero - Teal section */}
      <section className="section-teal pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-primary blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <img
              src={manomayaLogo}
              alt="Manomaya"
              className="w-24 h-24 mx-auto rounded-lg glow-soft mb-8"
            />
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6">
              About Manomaya
            </h1>
            <p className="text-xl text-primary">
              मनोमय — of the mind
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content - Cream section */}
      <section className="section-cream py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="prose prose-lg"
          >
            <div className="space-y-8 text-soft-gray leading-relaxed">
              <p className="text-xl text-teal-deep font-serif">
                Manomaya is a sacred corner of the web — a quiet place in a noisy world.
              </p>

              <p>
                In a digital landscape filled with infinite feeds, attention traps, and 
                constant notifications, Manomaya exists as a sanctuary. Here, content is 
                meant to be timeless, searchable, and emotionally grounding.
              </p>

              <div className="py-8 border-y border-teal-deep/20">
                <h2 className="text-2xl font-serif text-teal-deep mb-6">Our Philosophy</h2>
                <ul className="space-y-4 text-soft-gray">
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✦</span>
                    <span>No ads. No trackers. No infinite scroll.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✦</span>
                    <span>Movement supports attention, not steals it.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✦</span>
                    <span>Typography invites reading, not scanning.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">✦</span>
                    <span>Every element is intentional and minimal.</span>
                  </li>
                </ul>
              </div>

              <p>
                The name "Manomaya" comes from Sanskrit, meaning "made of mind" or 
                "of the mind." In yogic philosophy, the Manomaya Kosha is the mental 
                sheath — the layer of consciousness where thoughts, emotions, and 
                perceptions arise.
              </p>

              <p>
                This space is dedicated to quotes, reflective images, and spiritual 
                stories that invite you to pause, breathe, and reconnect with the 
                stillness within.
              </p>
            </div>
          </motion.div>

          {/* Instagram CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 text-center"
          >
            <div className="divider-gold w-16 mx-auto mb-8" style={{ background: "linear-gradient(90deg, transparent, hsl(170 52% 24% / 0.4), transparent)" }} />
            <p className="text-soft-gray mb-6">Connect with us</p>
            <a
              href="https://www.instagram.com/manomaya/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-teal-deep text-cream rounded-lg transition-all duration-300 hover:bg-teal-light hover:scale-105"
            >
              <Instagram size={20} />
              <span>@manomaya</span>
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;

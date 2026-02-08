import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="section-teal py-16 md:py-24 px-6 border-t border-gold/10">
      <div className="max-w-4xl mx-auto">
        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <blockquote className="font-serif text-2xl md:text-3xl text-foreground/80 italic leading-relaxed mb-4">
            "The quieter you become, the more you can hear."
          </blockquote>
          <cite className="text-muted-foreground text-sm not-italic">— Ram Dass</cite>
        </motion.div>

        {/* Divider */}
        <div className="divider-gold w-24 mx-auto mb-12" />

        {/* Links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          {/* Nav Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/feed" className="hover:text-primary transition-colors">Reflections</Link>
            <Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          </div>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/manomaya/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            <Instagram size={18} />
            <span className="text-sm tracking-wide">@manomaya</span>
          </a>
        </motion.div>

        {/* Copyright */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 text-center text-xs text-muted-foreground/40 tracking-wide"
        >
          © {new Date().getFullYear()} Manomaya — A quiet place in a noisy world
        </motion.p>
      </div>
    </footer>
  );
};

export default Footer;

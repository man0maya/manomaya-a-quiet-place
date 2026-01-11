import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto text-center">
        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-2xl md:text-3xl text-foreground/90 italic leading-relaxed"
        >
          "The quieter you become, the more you can hear."
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          — Ram Dass
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className="my-16 divider-gold w-16 mx-auto"
        />

        {/* Instagram link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <a
            href="https://www.instagram.com/manomaya/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-500 group"
          >
            <Instagram className="w-5 h-5" />
            <span className="text-sm tracking-wide font-sans">@manomaya</span>
          </a>
        </motion.div>

        {/* Copyright */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 text-xs text-muted-foreground/50 tracking-wide"
        >
          © {new Date().getFullYear()} Manomaya
        </motion.p>
      </div>
    </footer>
  );
};

export default Footer;

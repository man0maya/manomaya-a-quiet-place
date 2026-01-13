import { motion } from "framer-motion";
import manomayaLogo from "@/assets/manomaya-logo.png";

const Hero = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 relative overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-darker via-background to-background pointer-events-none" />
      
      {/* Decorative orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/30 to-transparent blur-[100px] pointer-events-none"
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        {/* Logo - clean circular presentation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 blur-2xl opacity-30 bg-primary rounded-full scale-125" />
          <div className="relative w-36 h-36 md:w-48 md:h-48 mx-auto rounded-full overflow-hidden bg-background/80 backdrop-blur-sm border border-primary/20 shadow-lg">
            <img 
              src={manomayaLogo} 
              alt="Manomaya" 
              className="w-full h-full object-cover float"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-5xl md:text-7xl font-serif text-foreground mb-6"
        >
          Manomaya
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-xl md:text-2xl text-primary font-light tracking-wide mb-8"
        >
          A quiet place in a noisy world
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="text-muted-foreground leading-relaxed max-w-xl mx-auto mb-12"
        >
          A sacred corner of the web for quotes, reflections, and spiritual stories. 
          No ads. No trackers. Just stillness.
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 1.1 }}
          className="divider-gold w-32 mx-auto mb-8"
        />

        {/* Sanskrit subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="text-sm tracking-widest-xl text-primary/60 uppercase font-sans"
        >
          मनोमय — of the mind
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-widest text-muted-foreground/60 uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-primary/40 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;

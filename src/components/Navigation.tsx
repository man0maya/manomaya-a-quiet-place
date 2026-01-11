import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import manomayaLogo from "@/assets/manomaya-logo.jpg";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Gallery", path: "/gallery" },
  { name: "Quotes", path: "/quotes" },
  { name: "Stories", path: "/stories" },
  { name: "About", path: "/about" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-teal-darker/90 backdrop-blur-md border-b border-gold/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={manomayaLogo} 
              alt="Manomaya" 
              className="w-10 h-10 rounded object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="text-lg font-serif text-primary hidden sm:block">
              manomaya
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link text-sm tracking-wide transition-colors duration-300 ${
                  location.pathname === item.path
                    ? "text-primary active"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground/80 hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-teal-darker/95 backdrop-blur-md border-t border-gold/10"
          >
            <div className="px-6 py-6 space-y-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block text-lg font-serif transition-colors ${
                      location.pathname === item.path
                        ? "text-primary"
                        : "text-foreground/70"
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;

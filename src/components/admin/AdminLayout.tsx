import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Quote, 
  LogOut, 
  Menu, 
  X,
  Flower2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/stories', label: 'Stories', icon: BookOpen },
  { path: '/admin/quotes', label: 'Quotes', icon: Quote },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Flower2 className="w-6 h-6 text-primary" />
          <span className="font-serif text-lg text-foreground">Manomaya</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border"
            >
              <SidebarContent 
                onClose={() => setSidebarOpen(false)}
                onSignOut={handleSignOut}
                isActive={isActive}
                userEmail={user?.email}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col">
        <SidebarContent 
          onSignOut={handleSignOut}
          isActive={isActive}
          userEmail={user?.email}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-serif text-foreground">{title}</h1>
            <div className="divider-gold w-16 mt-4" />
          </motion.div>

          {/* Page Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

interface SidebarContentProps {
  onClose?: () => void;
  onSignOut: () => void;
  isActive: (path: string, exact?: boolean) => boolean;
  userEmail?: string;
}

function SidebarContent({ onClose, onSignOut, isActive, userEmail }: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-3">
          <Flower2 className="w-8 h-8 text-primary" />
          <span className="font-serif text-xl text-foreground">Manomaya</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    active
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="mb-3 px-4">
          <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
          <p className="text-xs text-primary">Administrator</p>
        </div>
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>

      {/* Back to Site */}
      <div className="p-4 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Website
        </Link>
      </div>
    </>
  );
}

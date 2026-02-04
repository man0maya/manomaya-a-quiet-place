import { BookOpen, Quote, Eye, Heart, Sparkles, FileText } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { useAdminPosts } from '@/hooks/usePosts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { posts } = useAdminPosts();
  
  const { data: reflections = [] } = useQuery({
    queryKey: ['admin-reflections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_reflections')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['admin-favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    { 
      label: 'Total Notes', 
      value: posts.length, 
      icon: FileText, 
      color: 'text-primary' 
    },
    { 
      label: 'Published Notes', 
      value: posts.filter(p => p.status === 'published').length, 
      icon: Eye, 
      color: 'text-primary' 
    },
    { 
      label: 'AI Reflections', 
      value: reflections.length, 
      icon: Sparkles, 
      color: 'text-primary' 
    },
    { 
      label: 'Total Favorites', 
      value: favorites.length, 
      icon: Heart, 
      color: 'text-primary' 
    },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout title="Dashboard">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-serif text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card rounded-lg border border-border p-6">
          <h2 className="font-serif text-xl text-foreground mb-4">Quick Start</h2>
          <p className="text-muted-foreground mb-4">
            Welcome to the Manomaya admin panel. All content you publish will appear under the name "manomaya".
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>Notes:</strong> Create and publish spiritual notes and articles</li>
            <li><strong>Analytics:</strong> View engagement metrics and popular content</li>
            <li><strong>Draft Mode:</strong> Save posts as drafts before publishing</li>
            <li><strong>Scheduled Posts:</strong> Set future publish dates for your content</li>
          </ul>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Heart, Sparkles, FileText, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPosts } from '@/hooks/usePosts';

export default function AdminAnalytics() {
  const { posts } = useAdminPosts();

  const { data: reflections = [] } = useQuery({
    queryKey: ['analytics-reflections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_reflections')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['analytics-favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate most favorited content
  const favoriteCounts = favorites.reduce((acc: Record<string, number>, fav) => {
    acc[fav.content_id] = (acc[fav.content_id] || 0) + 1;
    return acc;
  }, {});

  const topFavorites = Object.entries(favoriteCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const stats = [
    { label: 'Total Notes', value: posts.length, icon: FileText },
    { label: 'Published Notes', value: posts.filter(p => p.status === 'published').length, icon: TrendingUp },
    { label: 'AI Reflections', value: reflections.length, icon: Sparkles },
    { label: 'Total Favorites', value: favorites.length, icon: Heart },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout title="Analytics">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-muted text-primary">
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

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Reflections */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-serif text-lg text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recent AI Reflections
              </h3>
              {reflections.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reflections yet</p>
              ) : (
                <div className="space-y-4">
                  {reflections.slice(0, 5).map((reflection) => (
                    <div key={reflection.id} className="border-b border-border pb-3 last:border-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        User searched: "{reflection.user_input}"
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">
                        {reflection.quote}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Favorited */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-serif text-lg text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Most Saved Content
              </h3>
              {topFavorites.length === 0 ? (
                <p className="text-muted-foreground text-sm">No favorites yet</p>
              ) : (
                <div className="space-y-3">
                  {topFavorites.map(([id, count], index) => (
                    <div key={id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        #{index + 1} Content ID: {id.slice(0, 8)}...
                      </span>
                      <span className="text-sm font-medium text-primary">{count} saves</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

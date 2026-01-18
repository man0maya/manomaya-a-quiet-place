import { BookOpen, Quote, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { useAdminStories } from '@/hooks/useAdminStories';
import { useAdminQuotes } from '@/hooks/useAdminQuotes';

export default function AdminDashboard() {
  const { stories } = useAdminStories();
  const { quotes } = useAdminQuotes();

  const stats = [
    { label: 'Total Stories', value: stories.length, icon: BookOpen, color: 'text-blue-400' },
    { label: 'Total Quotes', value: quotes.length, icon: Quote, color: 'text-amber-400' },
    { label: 'Published Stories', value: stories.filter(s => s.is_active).length, icon: Eye, color: 'text-green-400' },
    { label: 'Published Quotes', value: quotes.filter(q => q.is_active).length, icon: Eye, color: 'text-green-400' },
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
          <p className="text-muted-foreground">
            Welcome to the Manomaya admin panel. Use the sidebar to manage your stories and quotes.
          </p>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

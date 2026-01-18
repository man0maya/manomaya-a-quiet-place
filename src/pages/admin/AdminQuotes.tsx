import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import DataTable from '@/components/admin/DataTable';
import QuoteForm from '@/components/admin/QuoteForm';
import { useAdminQuotes, Quote } from '@/hooks/useAdminQuotes';

export default function AdminQuotes() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  
  const { quotes, isLoading, createQuote, updateQuote, deleteQuote, toggleActive, reorderQuotes } = useAdminQuotes();

  const handleAdd = () => {
    setEditingQuote(undefined);
    setFormOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingQuote) {
      await updateQuote.mutateAsync({ ...data, id: editingQuote.id });
    } else {
      await createQuote.mutateAsync(data);
    }
  };

  const columns = [
    { 
      key: 'text' as const, 
      header: 'Quote',
      className: 'col-span-2',
      render: (quote: Quote) => (
        <p className="text-sm text-foreground line-clamp-2">"{quote.text}"</p>
      )
    },
    { key: 'author' as const, header: 'Author' },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout title="Quotes">
        <DataTable
          data={quotes}
          columns={columns}
          isLoading={isLoading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={(id) => deleteQuote.mutate(id)}
          onToggleActive={(id, is_active) => toggleActive.mutate({ id, is_active })}
          onReorder={(ids) => reorderQuotes.mutate(ids)}
          addLabel="Add Quote"
          searchPlaceholder="Search quotes..."
        />

        <QuoteForm
          quote={editingQuote}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          isLoading={createQuote.isPending || updateQuote.isPending}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}

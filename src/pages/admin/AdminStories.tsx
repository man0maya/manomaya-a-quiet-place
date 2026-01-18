import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import DataTable from '@/components/admin/DataTable';
import StoryForm from '@/components/admin/StoryForm';
import { useAdminStories, Story } from '@/hooks/useAdminStories';

export default function AdminStories() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | undefined>();
  
  const { stories, isLoading, createStory, updateStory, deleteStory, toggleActive, reorderStories } = useAdminStories();

  const handleAdd = () => {
    setEditingStory(undefined);
    setFormOpen(true);
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingStory) {
      await updateStory.mutateAsync({ ...data, id: editingStory.id });
    } else {
      await createStory.mutateAsync(data);
    }
  };

  const columns = [
    { key: 'title' as const, header: 'Title', className: 'col-span-2' },
    { key: 'read_time' as const, header: 'Read Time' },
    { 
      key: 'image_url' as const, 
      header: 'Image',
      render: (story: Story) => story.image_url ? (
        <img src={story.image_url} alt="" className="w-12 h-12 rounded object-cover" />
      ) : <span className="text-muted-foreground">-</span>
    },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout title="Stories">
        <DataTable
          data={stories}
          columns={columns}
          isLoading={isLoading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={(id) => deleteStory.mutate(id)}
          onToggleActive={(id, is_active) => toggleActive.mutate({ id, is_active })}
          onReorder={(ids) => reorderStories.mutate(ids)}
          addLabel="Add Story"
          searchPlaceholder="Search stories..."
        />

        <StoryForm
          story={editingStory}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          isLoading={createStory.isPending || updateStory.isPending}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}

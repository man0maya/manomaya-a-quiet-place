import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Eye, EyeOff, Clock, FileText, Image } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import ImageUploader from '@/components/admin/ImageUploader';
import { useAdminPosts, Post } from '@/hooks/usePosts';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduled_for: string;
}

export default function AdminPosts() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { posts, isLoading, createPost, updatePost, deletePost, publishPost } = useAdminPosts();
  const { uploadImage, uploading } = useImageUpload('stories-images');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PostFormData>({
    defaultValues: {
      status: 'draft',
    },
  });

  const watchStatus = watch('status');
  const watchImageUrl = watch('image_url');

  const openForm = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      reset({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        image_url: post.image_url || '',
        status: post.status as 'draft' | 'published' | 'scheduled',
        scheduled_for: post.scheduled_for ? format(new Date(post.scheduled_for), "yyyy-MM-dd'T'HH:mm") : '',
      });
    } else {
      setEditingPost(null);
      reset({
        title: '',
        content: '',
        excerpt: '',
        image_url: '',
        status: 'draft',
        scheduled_for: '',
      });
    }
    setFormOpen(true);
  };

  const onSubmit = async (data: PostFormData) => {
    const postData = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
      image_url: data.image_url || null,
      status: data.status,
      scheduled_for: data.status === 'scheduled' && data.scheduled_for ? new Date(data.scheduled_for).toISOString() : null,
      display_order: editingPost?.display_order || 0,
      published_at: editingPost?.published_at || null,
    };

    if (editingPost) {
      await updatePost.mutateAsync({ ...postData, id: editingPost.id });
    } else {
      await createPost.mutateAsync(postData);
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePost.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const togglePublish = (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    publishPost.mutate({ id: post.id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">Published</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30">Scheduled</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout title="Notes">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Manage your notes and articles. All posts are attributed to "manomaya".
            </p>
            <Button onClick={() => openForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>

          {/* Posts Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-40">Date</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      No notes yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        {post.image_url ? (
                          <img src={post.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.status === 'scheduled' && post.scheduled_for ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(post.scheduled_for), 'MMM d, yyyy h:mm a')}
                          </span>
                        ) : post.published_at ? (
                          format(new Date(post.published_at), 'MMM d, yyyy')
                        ) : (
                          format(new Date(post.created_at), 'MMM d, yyyy')
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish(post)}
                            className="h-8 w-8"
                          >
                            {post.status === 'published' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(post)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(post.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Note' : 'Create New Note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter note title..."
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  {...register('excerpt')}
                  placeholder="Brief description (optional)..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  {...register('content', { required: 'Content is required' })}
                  placeholder="Write your note... (Markdown supported)"
                  rows={10}
                  className="font-mono"
                />
                {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <ImageUploader
                  value={watchImageUrl || ''}
                  onChange={(url) => setValue('image_url', url || '')}
                  onUpload={uploadImage}
                  uploading={uploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={watchStatus}
                    onValueChange={(value: 'draft' | 'published' | 'scheduled') => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {watchStatus === 'scheduled' && (
                  <div className="space-y-2">
                    <Label>Schedule For</Label>
                    <Input
                      type="datetime-local"
                      {...register('scheduled_for')}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                  {createPost.isPending || updatePost.isPending ? 'Saving...' : editingPost ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The note will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}

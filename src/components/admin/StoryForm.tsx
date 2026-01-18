import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Instagram, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ImageUploader from './ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import type { Story, StoryInput } from '@/hooks/useAdminStories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const storySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  read_time: z.string().optional(),
  is_active: z.boolean().default(true),
});

type StoryFormData = z.infer<typeof storySchema>;

interface StoryFormProps {
  story?: Story;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StoryInput) => Promise<void>;
  isLoading?: boolean;
}

export default function StoryForm({
  story,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: StoryFormProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(story?.image_url ?? undefined);
  const { uploadImage, uploading } = useImageUpload('stories-images');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: story?.title ?? '',
      content: story?.content ?? '',
      excerpt: story?.excerpt ?? '',
      video_url: story?.video_url ?? '',
      read_time: story?.read_time ?? '5 min read',
      is_active: story?.is_active ?? true,
    },
  });

  const isActive = watch('is_active');

  const handleFormSubmit = async (data: StoryFormData) => {
    await onSubmit({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || undefined,
      video_url: data.video_url || undefined,
      read_time: data.read_time,
      is_active: data.is_active,
      image_url: imageUrl,
    });
    reset();
    setImageUrl(undefined);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    setImageUrl(story?.image_url ?? undefined);
    onOpenChange(false);
  };

  const isInstagramUrl = (url: string) => {
    return url.includes('instagram.com');
  };

  const videoUrl = watch('video_url');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            {story ? 'Edit Story' : 'Add New Story'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter story title..."
              className="bg-background"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              {...register('excerpt')}
              placeholder="Brief summary (appears in cards)..."
              rows={2}
              className="bg-background"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Full story content..."
              rows={8}
              className="bg-background"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              onUpload={uploadImage}
              uploading={uploading}
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="video_url" className="flex items-center gap-2">
              Video URL
              {videoUrl && isInstagramUrl(videoUrl) && (
                <Instagram className="w-4 h-4 text-pink-500" />
              )}
              {videoUrl && !isInstagramUrl(videoUrl) && (
                <Video className="w-4 h-4 text-primary" />
              )}
            </Label>
            <Input
              id="video_url"
              {...register('video_url')}
              placeholder="Instagram reel URL or video URL..."
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Supports Instagram reels and self-hosted videos
            </p>
          </div>

          {/* Read Time */}
          <div className="space-y-2">
            <Label htmlFor="read_time">Read Time</Label>
            <Input
              id="read_time"
              {...register('read_time')}
              placeholder="5 min read"
              className="bg-background max-w-[200px]"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="is_active" className="font-medium">
                Published
              </Label>
              <p className="text-sm text-muted-foreground">
                Story will be visible on the public site
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || uploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {story ? 'Update Story' : 'Create Story'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

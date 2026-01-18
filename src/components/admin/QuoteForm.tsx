import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ImageUploader from './ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import type { Quote, QuoteInput } from '@/hooks/useAdminQuotes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const quoteSchema = z.object({
  text: z.string().min(1, 'Quote text is required').max(1000),
  author: z.string().min(1, 'Author is required').max(200),
  is_active: z.boolean().default(true),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  quote?: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuoteInput) => Promise<void>;
  isLoading?: boolean;
}

export default function QuoteForm({
  quote,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: QuoteFormProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(quote?.image_url ?? undefined);
  const { uploadImage, uploading } = useImageUpload('quotes-images');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      text: quote?.text ?? '',
      author: quote?.author ?? '',
      is_active: quote?.is_active ?? true,
    },
  });

  const isActive = watch('is_active');

  const handleFormSubmit = async (data: QuoteFormData) => {
    await onSubmit({
      text: data.text,
      author: data.author,
      is_active: data.is_active,
      image_url: imageUrl,
    });
    reset();
    setImageUrl(undefined);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    setImageUrl(quote?.image_url ?? undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            {quote ? 'Edit Quote' : 'Add New Quote'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">
          {/* Quote Text */}
          <div className="space-y-2">
            <Label htmlFor="text">Quote *</Label>
            <Textarea
              id="text"
              {...register('text')}
              placeholder="Enter the quote text..."
              rows={4}
              className="bg-background"
            />
            {errors.text && (
              <p className="text-sm text-destructive">{errors.text.message}</p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              {...register('author')}
              placeholder="Quote author..."
              className="bg-background"
            />
            {errors.author && (
              <p className="text-sm text-destructive">{errors.author.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Background Image</Label>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              onUpload={uploadImage}
              uploading={uploading}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="is_active" className="font-medium">
                Published
              </Label>
              <p className="text-sm text-muted-foreground">
                Quote will be visible on the public site
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
              {quote ? 'Update Quote' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

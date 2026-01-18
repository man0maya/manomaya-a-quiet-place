import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  GripVertical, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Column<T> {
  key: keyof T | 'actions';
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: string; is_active: boolean }> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  onReorder: (orderedIds: string[]) => void;
  onAdd: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
}

export default function DataTable<T extends { id: string; is_active: boolean }>({
  data,
  columns,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  onAdd,
  addLabel = 'Add New',
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [items, setItems] = useState(data);

  // Update items when data changes
  if (JSON.stringify(items.map(i => i.id)) !== JSON.stringify(data.map(d => d.id))) {
    setItems(data);
  }

  const handleReorder = (newOrder: T[]) => {
    setItems(newOrder);
  };

  const handleReorderEnd = () => {
    onReorder(items.map(item => item.id));
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Button onClick={onAdd} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          {addLabel}
        </Button>
      </div>

      {/* Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No items found</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={filteredItems}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {filteredItems.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              onDragEnd={handleReorderEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div
                layout
                className={cn(
                  'bg-card rounded-lg border border-border p-4',
                  'hover:border-primary/30 transition-colors',
                  !item.is_active && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="text-muted-foreground">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {columns.map((column) => {
                      if (column.key === 'actions') return null;
                      return (
                        <div key={String(column.key)} className={column.className}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {column.header}
                          </p>
                          {column.render ? (
                            column.render(item)
                          ) : (
                            <p className="text-sm text-foreground truncate">
                              {String(item[column.key as keyof T] ?? '-')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Status Badge */}
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Published' : 'Draft'}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(checked) => onToggleActive(item.id, checked)}
                      aria-label={item.is_active ? 'Unpublish' : 'Publish'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(item.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

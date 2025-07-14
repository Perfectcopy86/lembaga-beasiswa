// src/app/admin/settings/components/category-manager.tsx
'use client';

import { useState, useTransition, useRef } from 'react';
import { addCategory, deleteCategory } from '../actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

type Category = { id: number; name: string };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  // const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    startTransition(async () => {
      const result = await addCategory(newCategory.trim());
      if (result.success) {
        // Optimistically update UI, though revalidation will handle it
        setNewCategory('');
        inputRef.current?.focus();
      } else {
        alert(result.message);
      }
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Yakin ingin menghapus kategori ini?')) {
      startTransition(async () => {
        await deleteCategory(id);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Nama kategori baru..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={isPending || !newCategory.trim()} className="flex-shrink-0">
          <Plus size={16} className="mr-1" /> Tambah
        </Button>
      </div>
      <ul className="space-y-2 rounded-md border p-2 h-64 overflow-y-auto">
        {initialCategories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50">
            <span className="text-sm">{cat.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(cat.id)}
              disabled={isPending}
            >
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </li>
        ))}
         {initialCategories.length === 0 && (
            <li className="text-center text-sm text-muted-foreground p-4">
                Belum ada kategori.
            </li>
        )}
      </ul>
    </div>
  );
}

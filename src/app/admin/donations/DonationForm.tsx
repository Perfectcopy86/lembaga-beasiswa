'use client';

import { useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { KategoriBeasiswa, DonasiWithRelations } from '@/lib/types';
import { upsertDonationWithItems } from './actions';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Plus } from 'lucide-react';

const formSchema = z.object({
  nama_donatur: z.string().min(1, 'Nama donatur wajib diisi.'),
  tanggal_donasi: z.string().min(1, 'Tanggal donasi wajib diisi.'),
  items: z.array(z.object({
      kategori_id: z.string().min(1, 'Pilih kategori.'),
      kuantitas: z.coerce.number().min(1, 'Min. 1.'),
    }))
    .min(1, 'Harus ada minimal 1 item donasi.'),
});

type DonationFormProps = {
  kategoriBeasiswa: KategoriBeasiswa[];
  onFormSubmit: () => void;
  donation?: DonasiWithRelations;
};

// Fungsi untuk mengelompokkan item dari DB untuk ditampilkan di form
const getGroupedItemsForForm = (items: DonasiWithRelations['donation_items']) => {
    if (!items || items.length === 0) {
        return [{ kategori_id: '', kuantitas: 1 }];
    }
    
    const grouped = items.reduce((acc, item) => {
      const key = item.kategori_id;
      if (!acc[key]) {
        acc[key] = {
          kategori_id: String(key),
          kuantitas: 0,
        };
      }
      acc[key].kuantitas += 1;
      return acc;
    }, {} as Record<string, { kategori_id: string; kuantitas: number }>);

    return Object.values(grouped);
};

export function DonationForm({ kategoriBeasiswa, onFormSubmit, donation }: DonationFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!donation;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_donatur: donation?.nama_donatur || '',
      tanggal_donasi: donation ? new Date(donation.tanggal_donasi).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: isEditMode ? getGroupedItemsForForm(donation.donation_items) : [{ kategori_id: '', kuantitas: 1 }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append('nama_donatur', values.nama_donatur);
    formData.append('tanggal_donasi', values.tanggal_donasi);
    formData.append('items', JSON.stringify(values.items));

    startTransition(async () => {
        const result = await upsertDonationWithItems(formData, donation ? donation.id : null);
        
        if (result?.error) {
          toast.error('Gagal menyimpan donasi!', {
            description: Object.values(result.error).flat().join('\n'),
          });
        } else {
          toast.success(isEditMode ? 'Donasi berhasil diperbarui!' : 'Donasi berhasil disimpan!');
          onFormSubmit();
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nama_donatur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Donatur</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama donatur..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tanggal_donasi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Donasi</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Item Donasi</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/50">
                <FormField
                  control={form.control}
                  name={`items.${index}.kategori_id`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Kategori</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Pilih kategori..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kategoriBeasiswa.map((k) => (
                            <SelectItem key={k.id} value={String(k.id)}>
                              {k.nama_kategori} (Rp.{new Intl.NumberFormat('id-ID').format(k.nominal_per_slot)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`items.${index}.kuantitas`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          className="w-20 text-center" 
                          {...field}
                          value={field.value?.toString() || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-destructive cursor-pointer"/>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ kategori_id: '', kuantitas: 1 })}
            className="mt-4 cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan...' : (isEditMode ? 'Perbarui Donasi' : 'Simpan Donasi')}
            </Button>
        </div>
      </form>
    </Form>
  );
}

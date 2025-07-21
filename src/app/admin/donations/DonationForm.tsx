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
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';

const formSchema = z.object({
  nama_donatur: z.string().min(1, 'Nama donatur wajib diisi.'),
  tanggal_donasi: z.string().min(1, 'Tanggal donasi wajib diisi.'),
  is_anonymous: z.boolean().default(true),
  user_id: z.string().optional(), 
  items: z.array(z.object({
      kategori_id: z.string().min(1, 'Pilih kategori.'),
      kuantitas: z.coerce.number().min(1, 'Min. 1.'),
    }))
    .min(1, 'Harus ada minimal 1 item donasi.'),
});

type UserProfile = {
    id: string;
    nama_donatur: string;
};

type DonationFormProps = {
  kategoriBeasiswa: KategoriBeasiswa[];
  userProfiles: UserProfile[]; 
  onFormSubmit: () => void;
  donation?: DonasiWithRelations;
};

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

export function DonationForm({ kategoriBeasiswa, userProfiles, onFormSubmit, donation }: DonationFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!donation;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_donatur: donation?.nama_donatur || '',
      tanggal_donasi: donation ? new Date(donation.tanggal_donasi).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      is_anonymous: donation?.is_anonymous || true,
      user_id: donation?.user_id || '', 
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
    formData.append('is_anonymous', String(values.is_anonymous));
    if (values.user_id) {
        formData.append('user_id', values.user_id);
    }
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
        {/* Bagian Nama Donatur dan Tanggal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nama_donatur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Donatur</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama..." {...field} />
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

        {/* Bagian Pengguna Terkait */}
        <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Pengguna Terkait (Opsional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Pilih pengguna..." />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {userProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                        {profile.nama_donatur}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        
        {/* Bagian Item Donasi */}
        <div>
          <h3 className="text-sm font-medium mb-2">Item Donasi</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              // --- PERUBAHAN UTAMA DI SINI ---
              // Menghilangkan padding, hanya menggunakan gap.
              // Menggunakan border untuk memisahkan item secara visual.
              <div key={field.id} className="border-t pt-4 space-y-4">
                 <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
                    <FormField
                    control={form.control}
                    name={`items.${index}.kategori_id`}
                    render={({ field }) => (
                        <FormItem className="flex-1 w-full">
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori beasiswa..." />
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
                        <FormItem className="w-full sm:w-24">
                        <FormLabel>Qty</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            min="1" 
                            className="text-center" 
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
                    className="shrink-0 self-end sm:self-end"
                    >
                    <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                 </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ kategori_id: '', kuantitas: 1 })}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
        
        {/* Bagian Checkbox Anonim */}
        <FormField
          control={form.control}
          name="is_anonymous"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Jadikan donasi ini Anonim
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                   Nama donatur akan disensor di halaman publik.
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Menyimpan...' : (isEditMode ? 'Perbarui Donasi' : 'Simpan Donasi')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
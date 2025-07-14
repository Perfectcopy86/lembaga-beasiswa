// src/app/admin/expenses/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Skema validasi HANYA untuk field teks
const ExpenseTextSchema = z.object({
  penerima: z.string().min(1, { message: "Penerima tidak boleh kosong." }),
  deskripsi: z.string().min(1, { message: "Deskripsi tidak boleh kosong." }),
  jumlah: z.coerce.number().min(1, { message: "Jumlah harus lebih dari 0." }),
  tanggal: z.string().min(1, { message: "Tanggal tidak boleh kosong." }),
  kategori: z.string().min(1, { message: "Kategori tidak boleh kosong." }),
  metode: z.string().min(1, { message: "Metode tidak boleh kosong." }),
});

export async function saveExpense(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const isUpdate = !!id;

  // 1. Validasi field teks terlebih dahulu
  const validatedFields = ExpenseTextSchema.safeParse({
    penerima: formData.get('penerima'),
    deskripsi: formData.get('deskripsi'),
    jumlah: formData.get('jumlah'),
    tanggal: formData.get('tanggal'),
    kategori: formData.get('kategori'),
    metode: formData.get('metode'),
  });

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Input tidak valid. Periksa kembali semua field." };
  }

  const dataToSave = validatedFields.data;
  
  // 2. Proses file secara terpisah setelah validasi berhasil
  const buktiFile = formData.get('bukti-transaksi') as File;
  let bukti = formData.get('current_bukti') as string | null;

  if (buktiFile && buktiFile.size > 0) {
    const filePath = `public/${Date.now()}-${buktiFile.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('bukti-transaksi')
      .upload(filePath, buktiFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, message: 'Gagal mengunggah bukti transaksi.' };
    }

    bukti = supabase.storage
      .from('bukti-transaksi')
      .getPublicUrl(filePath).data.publicUrl;
  }
  
  const finalData = { ...dataToSave, bukti };

  // 3. Simpan ke database
  const { error } = isUpdate
    ? await supabase.from('expenses').update(finalData).eq('id', id)
    : await supabase.from('expenses').insert([finalData]);

  if (error) {
    console.error('Error saving expense:', error);
    return { success: false, message: `Gagal menyimpan data: ${error.message}` };
  }

  revalidatePath('/admin/expenses');
  revalidatePath('/admin');
  return { success: true, message: `Pengeluaran berhasil ${isUpdate ? 'diperbarui' : 'ditambahkan'}.` };
}

// Fungsi untuk menghapus pengeluaran
export async function deleteExpense(id: number, bukti?: string | null) {
    if (!id) {
      return { success: false, message: 'ID pengeluaran tidak valid.' };
    }
    
    const supabase = await createClient();
  
    // Hapus file dari storage jika ada
    if (bukti) {
      try {
        const filePath = new URL(bukti).pathname.split('/bukti-transaksi/')[1];
        if (filePath) {
          await supabase.storage.from('bukti-transaksi').remove([filePath]);
        }
      } catch (e) {
          console.error("Could not parse file path from URL:", e)
      }
    }
  
    // Hapus record dari database
    const { error } = await supabase.from('expenses').delete().eq('id', id);
  
    if (error) {
      console.error('Error deleting expense:', error);
      return { success: false, message: `Gagal menghapus data: ${error.message}` };
    }
  
    revalidatePath('/admin/expenses');
    revalidatePath('/admin');
    return { success: true, message: 'Pengeluaran berhasil dihapus.' };
  }

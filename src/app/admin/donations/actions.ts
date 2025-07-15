'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Skema validasi dari form tetap sama, karena form masih mengirim kuantitas
const donationSchema = z.object({
  nama_donatur: z.string().min(1, 'Nama donatur harus diisi.'),
  tanggal_donasi: z.string().min(1, 'Tanggal donasi harus diisi.'),
  items: z.array(z.object({
      kategori_id: z.coerce.number().min(1, 'Kategori harus dipilih.'),
      kuantitas: z.coerce.number().min(1, 'Kuantitas minimal 1.'),
    }))
    .min(1, 'Minimal harus ada satu item donasi.'),
});

export async function upsertDonationWithItems(
  formData: FormData,
  id: number | null
) {
  const supabase = await createClient();

  const validated = donationSchema.safeParse({
    nama_donatur: formData.get('nama_donatur'),
    tanggal_donasi: formData.get('tanggal_donasi'),
    items: JSON.parse(formData.get('items') as string),
  });

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }
  
  const { nama_donatur, tanggal_donasi, items } = validated.data;
  
  try {
    // Menghitung total donasi (logika ini tetap sama)
    const kategoriIds = items.map(item => item.kategori_id);
    const { data: kategoriData, error: kategoriError } = await supabase
      .from('kategori_beasiswa')
      .select('id, nominal_per_slot')
      .in('id', kategoriIds);

    if (kategoriError) throw kategoriError;
    const hargaMap = new Map(kategoriData.map(k => [k.id, parseFloat(k.nominal_per_slot)]));
    
    let totalDonasi = 0;
    items.forEach(item => {
      const harga = hargaMap.get(item.kategori_id);
      if (harga === undefined) throw new Error(`Harga untuk kategori ID ${item.kategori_id} tidak ditemukan.`);
      totalDonasi += item.kuantitas * harga;
    });

    // === PERUBAHAN UTAMA DIMULAI DI SINI ===

    let donationId: number;

    if (id) {
      // MODE EDIT
      const { data: updatedDonation, error: updateError } = await supabase
        .from('donations')
        .update({ nama_donatur, tanggal_donasi, jumlah: totalDonasi })
        .eq('id', id)
        .select('id')
        .single();
      if (updateError) throw updateError;
      donationId = updatedDonation.id;
      
      // Hapus semua item lama yang terkait dengan donasi ini
      const { error: deleteItemsError } = await supabase.from('donation_items').delete().eq('donation_id', donationId);
      if (deleteItemsError) throw deleteItemsError;

    } else {
      // MODE INSERT
      const { data: newDonation, error: insertError } = await supabase
        .from('donations')
        .insert({ nama_donatur, tanggal_donasi, jumlah: totalDonasi })
        .select('id')
        .single();
      if (insertError) throw insertError;
      donationId = newDonation.id;
    }

    // "Ledakkan" item dari form menjadi baris-baris individual
    const individualItemsToInsert = items.flatMap(item => {
        return Array.from({ length: item.kuantitas }, () => ({
            donation_id: donationId,
            kategori_id: item.kategori_id,
        }));
    });

    // Masukkan semua item individual yang baru
    if (individualItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('donation_items').insert(individualItemsToInsert);
        if (itemsError) throw itemsError;
    }

  } catch (e: unknown) {
    return { error: { _general: [(e as Error).message ?? 'An unknown error occurred'] } };
  }

  revalidatePath('/admin/donations');
  revalidatePath('/admin/allocations'); // Revalidasi halaman alokasi juga
  return { success: true };
}

export async function deleteDonation(id: number) {
  const supabase = await createClient();
  try {
    // Foreign key constraint akan otomatis menghapus donation_items,
    // jadi kita hanya perlu menghapus donasi utamanya.
    const { error: donationError } = await supabase.from('donations').delete().eq('id', id);
    if (donationError) throw donationError;

  } catch (e: unknown) {
    return { error: (e as Error).message ?? 'An unknown error occurred' };
  }
  
  revalidatePath('/admin/donations');
  revalidatePath('/admin/allocations');
  return { success: true };
}

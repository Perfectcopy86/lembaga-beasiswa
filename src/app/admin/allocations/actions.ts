'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createAllocation(donationItemId: number, beswanId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Anda harus login untuk melakukan aksi ini.' };
  }

  // Validasi sekarang menjadi sangat sederhana.
  // Kita hanya perlu mencoba melakukan insert. Jika donation_item_id atau beswan_id
  // sudah ada, UNIQUE constraint di database akan mengembalikan error.
  
  const { error } = await supabase.from('alokasi_dana').insert({
    donation_item_id: donationItemId,
    beswan_id: beswanId,
    dialokasikan_oleh_admin_id: user.id,
  });

  if (error) {
    // Berikan pesan error yang lebih ramah pengguna
    if (error.code === '23505') { // Kode error untuk pelanggaran UNIQUE
        return { error: 'Gagal: Slot donasi atau beswan ini sudah teralokasi.' };
    }
    return { error: `Gagal membuat alokasi: ${error.message}` };
  }

  // Revalidate path agar data di halaman diperbarui secara otomatis
  revalidatePath('/admin/allocations');
  revalidatePath('/admin/map'); 
  return { success: true };
}

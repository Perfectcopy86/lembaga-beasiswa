'use server';

// Impor createClient dari supabase-js untuk membuat admin client
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const nama_donatur = formData.get('nama_donatur') as string;

  if (!id || !nama_donatur) {
    return { success: false, message: 'ID dan nama donatur harus diisi.' };
  }

  try {
    // Buat klien Supabase dengan hak akses admin menggunakan service_role key
    // Ini aman dilakukan di Server Action karena kode ini tidak pernah terekspos ke klien/browser
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Mengambil kunci dari .env.local
      { auth: { persistSession: false } }
    );

    // Langkah 1: Perbarui tabel 'profiles' menggunakan klien admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ nama_donatur })
      .eq('id', id);

    if (profileError) {
      // Log error untuk debugging di server
      console.error('Error updating profiles:', profileError.message);
      throw new Error(`Gagal memperbarui profil: ${profileError.message}`);
    }

    // Langkah 2: Perbarui tabel 'donations' menggunakan klien admin
    const { error: donationsError } = await supabaseAdmin
      .from('donations')
      .update({ nama_donatur: nama_donatur })
      .eq('user_id', id);

    if (donationsError) {
      // Log error untuk debugging di server
      console.error('Error updating donations:', donationsError.message);
      throw new Error(`Gagal memperbarui donasi: ${donationsError.message}`);
    }

    // Langkah 3: Revalidate cache untuk semua halaman yang terpengaruh
    revalidatePath('/profile');
    revalidatePath('/admin/donations'); // Sesuaikan dengan path halaman donasi Anda
    revalidatePath('/home');

    console.log(`Successfully updated name for user ${id} to "${nama_donatur}" in profiles and donations.`);
    return { success: true, message: 'Profil dan semua riwayat donasi berhasil diperbarui.' };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
    return { success: false, message: errorMessage };
  }
}
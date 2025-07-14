// src/app/admin/users/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Tipe untuk data peran yang akan diupdate
type UpdateRolePayload = {
  userId: string;
  newRole: 'admin' | 'user';
};

/**
 * Memperbarui peran (role) seorang pengguna di tabel profiles.
 * @param payload - Berisi userId dan newRole.
 * @returns Objek yang menandakan keberhasilan atau kegagalan.
 */
export async function updateUserRole(payload: UpdateRolePayload) {
  const { userId, newRole } = payload;

  if (!userId || !newRole) {
    return { success: false, message: 'User ID dan role baru dibutuhkan.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: `Gagal memperbarui role: ${error.message}` };
  }

  // Revalidate path agar data di halaman diperbarui
  revalidatePath('/admin/users');

  return { success: true, message: 'Role pengguna berhasil diperbarui.' };
}

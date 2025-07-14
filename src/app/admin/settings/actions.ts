// src/app/admin/settings/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Pengaturan Target Donasi ---

export async function updateDonationTargets(formData: FormData) {
  const supabase = await createClient();

  const monthlyTarget = formData.get('monthly_target') as string;
  const yearlyTarget = formData.get('yearly_target') as string;

  if (!monthlyTarget || !yearlyTarget) {
    return { success: false, message: 'Target bulanan dan tahunan harus diisi.' };
  }

  const dataToUpsert = [
    { setting_key: 'monthly_donation_target', setting_value: monthlyTarget },
    { setting_key: 'yearly_donation_target', setting_value: yearlyTarget },
  ];

  const { error } = await supabase.from('app_settings').upsert(dataToUpsert);

  if (error) {
    console.error('Error updating targets:', error);
    return { success: false, message: 'Gagal memperbarui target donasi.' };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/home'); // Revalidate dasbor pengguna agar grafik terupdate
  return { success: true, message: 'Target donasi berhasil diperbarui.' };
}

// --- Manajemen Kategori Pengeluaran ---

export async function addCategory(name: string) {
  if (!name) {
    return { success: false, message: 'Nama kategori tidak boleh kosong.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('expense_categories').insert([{ name }]);
  if (error) {
    return { success: false, message: `Gagal menambah: ${error.message}` };
  }
  revalidatePath('/admin/settings');
  return { success: true, message: 'Kategori berhasil ditambahkan.' };
}

export async function deleteCategory(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('expense_categories').delete().eq('id', id);
  if (error) {
    return { success: false, message: `Gagal menghapus: ${error.message}` };
  }
  revalidatePath('/admin/settings');
  return { success: true, message: 'Kategori berhasil dihapus.' };
}

// --- Pengaturan Status Keaktifan ---
export async function updateActivityThreshold(formData: FormData) {
  const supabase = await createClient();
  const thresholdDays = formData.get('threshold_days') as string;

  if (!thresholdDays || Number(thresholdDays) < 1) {
    return { success: false, message: 'Jumlah hari harus diisi dan lebih dari 0.' };
  }

  const { error } = await supabase.from('app_settings').upsert({
    setting_key: 'user_activity_threshold_days',
    setting_value: thresholdDays,
  });

  if (error) {
    return { success: false, message: 'Gagal memperbarui pengaturan.' };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/admin/users'); // Revalidate halaman pengguna juga
  return { success: true, message: 'Pengaturan keaktifan berhasil diperbarui.' };
}

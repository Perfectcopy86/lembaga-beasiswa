// src/app/(dashboard)/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClientPage from './profile-client-page';


export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: donations } = await supabase
    .from('donations')
    .select('id, tanggal_donasi, jumlah, keterangan')
    .eq('user_id', user.id)
    .order('tanggal_donasi', { ascending: false });

  // Ambil pengaturan ambang batas dari database
  const { data: settingData } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'user_activity_threshold_days')
    .single();
  
  // Gunakan nilai dari DB, atau 90 hari sebagai default jika tidak ada
  const activityThresholdDays = Number(settingData?.setting_value || 90);

  return (
    <ProfileClientPage
      profile={profile}
      donations={donations || []}
      activityThresholdDays={activityThresholdDays} // Teruskan nilai ke komponen klien
    />
  );
}

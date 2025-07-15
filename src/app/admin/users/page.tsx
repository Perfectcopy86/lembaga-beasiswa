// src/app/admin/users/page.tsx
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersTable } from './users-table';
import { subDays } from 'date-fns';

// DEFINISIKAN DAN EKSPOR TIPE DATA DI SINI
export type UserWithStats = {
  id: string;
  nama_donatur: string;
  email: string;
  role: 'admin' | 'user';
  donationStatus: 'Aktif' | 'Tidak Aktif';
  total_donasi: number;
  jumlah_transaksi: number;
};

export default async function AdminUsersPage() {
  let usersWithStats: UserWithStats[] = [];
  let fetchError: string | null = null;

  try {
    const supabase = await createServerClient();
    
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    if (profilesError) throw profilesError;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: donations, error: donationsError } = await supabase.from('donations').select('user_id, jumlah, tanggal_donasi');
    if (donationsError) throw donationsError;

    const { data: setting } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_activity_threshold_days').single();
    
    const authUsers = auth.users;
    const thresholdDays = Number(setting?.setting_value || 90);
    const thresholdDate = subDays(new Date(), thresholdDays);

    // Gabungkan data
    usersWithStats = profiles.map(profile => {
      const userDonations = donations.filter(d => d.user_id === profile.id);
      const total_donasi = userDonations.reduce((sum, d) => sum + d.jumlah, 0);
      const jumlah_transaksi = userDonations.length;
      const authUser = authUsers.find(u => u.id === profile.id);

      const lastDonation = userDonations.sort((a, b) => new Date(b.tanggal_donasi).getTime() - new Date(a.tanggal_donasi).getTime())[0];
      const lastDonationDate = lastDonation ? new Date(lastDonation.tanggal_donasi) : null;

      let donationStatus: 'Aktif' | 'Tidak Aktif' = 'Tidak Aktif';
      if (lastDonationDate && lastDonationDate > thresholdDate) {
          donationStatus = 'Aktif';
      }

      return {
        id: profile.id,
        nama_donatur: profile.nama_donatur || 'N/A',
        email: authUser?.email || 'N/A',
        role: (profile.role as 'admin' | 'user') || 'user',
        total_donasi,
        jumlah_transaksi,
        donationStatus,
      };
    });

  } catch (error: unknown) {
    console.error("Gagal memuat data awal pengguna:", error instanceof Error ? error.message : String(error));
    fetchError = error instanceof Error ? error.message : String(error); // Store error message
    // Biarkan eksekusi berlanjut untuk merender UsersTable
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Pengguna</CardTitle>
        <CardDescription>
          Lihat, kelola, dan ubah peran pengguna yang terdaftar di sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Selalu render UsersTable dan teruskan data beserta status error */}
        <UsersTable users={usersWithStats} error={fetchError} />
      </CardContent>
    </Card>
  );
}
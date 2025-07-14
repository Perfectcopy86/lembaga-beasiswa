import { createClient } from '@/lib/supabase/server';
import { UserNavClient } from './user-nav-client';

export async function UserNav() {
  // Gunakan try...catch untuk menangani potensi error jaringan di server
  try {
    const supabase = await createClient();
    
    // Proses pengambilan data pengguna
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Jika terjadi error saat mengambil user, langsung lempar ke catch block
    if (userError) throw userError;

    let profile = null;
    if (user) {
      // Ambil data profil jika user berhasil didapatkan
      const { data } = await supabase
        .from('profiles')
        .select('nama_donatur')
        .eq('id', user.id)
        .single();
      profile = data;
    }

    // Jika semua berhasil, tampilkan komponen dengan data yang ada
    return <UserNavClient user={user} profile={profile} />;

  } catch (error) {
    // Jika terjadi error 'fetch failed' atau error lainnya, tangkap di sini
    console.error("UserNav Fetch Error:", "Gagal mengambil data user, kemungkinan karena masalah jaringan. Menampilkan status logged out.", error);
    
    // Tampilkan komponen dalam keadaan logged out sebagai fallback yang aman
    // Komponen UserNavClient sudah bisa menangani jika user dan profile bernilai null
    return <UserNavClient user={null} profile={null} />;
  }
}
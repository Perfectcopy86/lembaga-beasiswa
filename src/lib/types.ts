// src/lib/types.ts

// Tipe data berdasarkan tabel 'kategori_beasiswa'
export type KategoriBeasiswa = {
    id: number;
    kode_kategori: string;
    nama_kategori: string;
    nominal_per_slot: number;
    deskripsi?: string | null;
  };
  
  // Tipe data berdasarkan tabel 'beswan'
  export type Beswan = {
    id: string; // UUID
    kode_beswan?: string | null;
    nama_beswan: string;
    kategori_id?: number | null;
    status: 'Aktif' | 'Menunggu' | 'Lulus' | 'Non-aktif';
    angkatan?: string | null;
  };
  
  // Tipe data berdasarkan tabel 'donations' yang sudah ada
  export type Donasi = {
    id: number;
    tanggal_donasi: string;
    nama_donatur: string;
    jumlah: number;
    keterangan?: string | null;
    user_id?: string | null;
    is_anonymous?: boolean;
    created_at: string;
  };
  
  // Tipe data berdasarkan tabel baru 'donation_items'
  export type DonationItem = {
    id: number;
    donation_id: number;
    kategori_id: number;
    kuantitas: number;
    subtotal: number;
  };
  
  // Tipe data untuk form donasi baru yang lebih kompleks
  export type DonationFormItem = {
    kategori_id: number | string; // Bisa string saat awal dipilih di form
    kuantitas: number;
  };
  
  export type DonationWithItems = Donasi & {
    donation_items: DonationItem[];
  };

  // Tipe ini merepresentasikan satu item donasi beserta relasi ke nama kategorinya
export type DonationItemWithRelations = DonationItem & {
  kategori_beasiswa: { nama_kategori: string } | null;
};

// Tipe ini adalah tipe lengkap untuk donasi beserta semua relasinya
export type DonasiWithRelations = Donasi & {
  donation_items: DonationItemWithRelations[];
  profiles: { nama_donatur: string } | null; // Tambahkan relasi ke tabel profiles
};
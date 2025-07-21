// src/app/admin/donations/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeStatus } from '@/context/realtime-context';
import { DonasiWithRelations, KategoriBeasiswa } from '@/lib/types';
import { DonationDialog } from './DonationDialog';
import { DonationsTable } from './DonationsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

// Definisikan tipe untuk user profile
type UserProfile = {
  id: string;
  nama_donatur: string;
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<DonasiWithRelations[]>([]);
  const [kategoriBeasiswa, setKategoriBeasiswa] = useState<KategoriBeasiswa[]>([]);
  // --- PERUBAHAN DIMULAI ---
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [donationsResult, kategoriResult, profilesResult] = await Promise.all([
        supabase
          .from("donations")
          // Sertakan relasi ke profiles
          .select("*, profiles(nama_donatur), donation_items(*, kategori_beasiswa(nama_kategori))")
          .order('tanggal_donasi', { ascending: false }),
        supabase
          .from("kategori_beasiswa")
          .select("*"),
        // Ambil data user dari tabel profiles
        supabase
          .from("profiles")
          .select("id, nama_donatur")
          .order('nama_donatur', { ascending: true })
      ]);

      if (donationsResult.error) throw donationsResult.error;
      if (kategoriResult.error) throw kategoriResult.error;
      if (profilesResult.error) throw profilesResult.error;
      
      setDonations(donationsResult.data || []);
      setKategoriBeasiswa(kategoriResult.data || []);
      setUserProfiles(profilesResult.data || []); // Simpan data user

    } catch (err: unknown) {
      console.error("Error fetching donations data:", err);
      setError("Gagal memuat data. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);
  // --- PERUBAHAN SELESAI ---

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('donations-changes-client')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation_items' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' }, // Dengarkan perubahan profiles juga
        () => fetchData()
      )
      .subscribe();
    
    addReconnectListener(fetchData);

    return () => {
      supabase.removeChannel(channel);
      removeReconnectListener(fetchData);
    };
  }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);

  const filteredDonations = useMemo(() => {
    if (!searchQuery) {
      return donations;
    }
    return donations.filter(donation => {
      const searchTerm = searchQuery.toLowerCase();
      const donaturMatch = donation.nama_donatur.toLowerCase().includes(searchTerm);
      // --- PERUBAHAN DIMULAI ---
      const userMatch = donation.profiles?.nama_donatur.toLowerCase().includes(searchTerm);
      const kategoriMatch = donation.donation_items.some(item =>
        item.kategori_beasiswa?.nama_kategori.toLowerCase().includes(searchTerm)
      );
      return donaturMatch || kategoriMatch || userMatch;
      // --- PERUBAHAN SELESAI ---
    });
  }, [donations, searchQuery]);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Donasi</h2>
          <p className="text-muted-foreground">
            Tambah, edit, atau hapus data donasi.
          </p>
        </div>
        <div className="flex items-center space-x-2">
        <DonationDialog 
            kategoriBeasiswa={kategoriBeasiswa} 
            userProfiles={userProfiles} // Teruskan data user
            onDataChange={fetchData} 
          />
        </div>
      </div>

      <div className="mb-4">
          <Input 
              placeholder="Cari nama donatur atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
          />
      </div>

      {error && <p className="text-red-500 text-center py-4">{error}</p>}
      {loading ? (
        <div className="rounded-md border">
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <DonationsTable 
            donations={filteredDonations} 
            kategoriBeasiswa={kategoriBeasiswa}
            userProfiles={userProfiles} // Teruskan data user
            onDataChange={fetchData}
          />
        </div>
      )}
    </>
  );
}
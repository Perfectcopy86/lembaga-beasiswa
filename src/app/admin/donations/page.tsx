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

type UserProfile = {
  id: string;
  nama_donatur: string;
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<DonasiWithRelations[]>([]);
  const [kategoriBeasiswa, setKategoriBeasiswa] = useState<KategoriBeasiswa[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [donationsResult, kategoriResult, profilesResult] = await Promise.all([
        supabase
          .from("donations")
          .select("*, profiles(nama_donatur), donation_items(*, kategori_beasiswa(nama_kategori))")
          .order('tanggal_donasi', { ascending: false }),
        supabase.from("kategori_beasiswa").select("*"),
        supabase.from("profiles").select("id, nama_donatur").order('nama_donatur', { ascending: true })
      ]);

      if (donationsResult.error) throw donationsResult.error;
      if (kategoriResult.error) throw kategoriResult.error;
      if (profilesResult.error) throw profilesResult.error;
      
      setDonations(donationsResult.data || []);
      setKategoriBeasiswa(kategoriResult.data || []);
      setUserProfiles(profilesResult.data || []);

    } catch (_err: unknown) {
      setError("Gagal memuat data. Coba muat ulang halaman.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    // Listeners and channel subscriptions...
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
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchData()
      )
      .subscribe();
    
    addReconnectListener(fetchData);

    return () => {
      supabase.removeChannel(channel);
      removeReconnectListener(fetchData);
    };
  }, [fetchData, supabase, addReconnectListener, removeReconnectListener]);

  const filteredDonations = useMemo(() => {
    if (!searchQuery) return donations;
    const searchTerm = searchQuery.toLowerCase();
    return donations.filter(d => 
        d.nama_donatur.toLowerCase().includes(searchTerm) ||
        d.profiles?.nama_donatur.toLowerCase().includes(searchTerm) ||
        d.donation_items.some(item => item.kategori_beasiswa?.nama_kategori.toLowerCase().includes(searchTerm))
    );
  }, [donations, searchQuery]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Donasi</h2>
          <p className="text-muted-foreground">Tambah, edit, atau hapus data donasi.</p>
        </div>
        <div className="shrink-0">
          <DonationDialog 
            kategoriBeasiswa={kategoriBeasiswa} 
            userProfiles={userProfiles}
            onDataChange={fetchData} 
          />
        </div>
      </div>

      <div className="w-full sm:max-w-xs">
          <Input 
              placeholder="Cari donatur atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
          />
      </div>

      {error && <p className="text-red-500 text-center py-4">{error}</p>}
      {loading ? (
        <div className="space-y-4 pt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <DonationsTable 
            donations={filteredDonations} 
            kategoriBeasiswa={kategoriBeasiswa}
            userProfiles={userProfiles}
            onDataChange={fetchData}
          />
        </div>
      )}
    </div>
  );
}
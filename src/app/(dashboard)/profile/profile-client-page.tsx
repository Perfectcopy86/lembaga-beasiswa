'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook status

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { updateProfile } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import DonationHistoryChart from './components/donation-history-chart';

// Tipe data tetap sama
type Profile = {
  id: string;
  nama_donatur: string;
  jenis_kelamin: string;
};

type Donation = {
  id: number;
  tanggal_donasi: string;
  jumlah: number;
  keterangan: string | null;
};

interface ProfileClientPageProps {
  profile: Profile | null;
  donations: Donation[];
  activityThresholdDays: number;
}

export default function ProfileClientPage({ profile: initialProfile, donations: initialDonations, activityThresholdDays }: ProfileClientPageProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [donations, setDonations] = useState(initialDonations);
  const [isEditing, setIsEditing] = useState(false);
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();
  const supabase = createClient();

  // --- AWAL PERUBAHAN UTAMA ---
  const fetchData = useCallback(async () => {
    if (!initialProfile) return;

    const [profileRes, donationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', initialProfile.id).single(),
        supabase.from('donations').select('*').eq('user_id', initialProfile.id).order('tanggal_donasi', { ascending: false })
    ]);

    if (profileRes.data) {
        setProfile(profileRes.data);
    }
    if (donationsRes.data) {
        setDonations(donationsRes.data);
    }
  }, [supabase, initialProfile]);

  useEffect(() => {
    if (!profile) return;

    fetchData(); // Panggil data awal

    const userId = profile.id;
    const channel = supabase
      .channel(`profile-donations-channel-reconnect-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations', filter: `user_id=eq.${userId}` },
        fetchData // Cukup panggil fetchData untuk menyederhanakan
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        fetchData // Cukup panggil fetchData untuk menyederhanakan
      )
      .subscribe();

    addReconnectListener(fetchData);

    return () => {
      supabase.removeChannel(channel);
      removeReconnectListener(fetchData);
    };
  },  [initialProfile, supabase, fetchData, addReconnectListener, removeReconnectListener]);
  // --- AKHIR PERUBAHAN UTAMA ---

  if (!profile) {
    return <div>Profil tidak ditemukan.</div>;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

  const totalDonasi = donations.reduce((sum, donation) => sum + donation.jumlah, 0);
  const lastDonationDate = donations.length > 0 ? new Date(donations[0].tanggal_donasi) : null;
  
  const thresholdDate = subDays(new Date(), activityThresholdDays); 
  const isActive = lastDonationDate ? lastDonationDate > thresholdDate : false;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.nama_donatur}`} />
                <AvatarFallback>{profile.nama_donatur.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.nama_donatur}</CardTitle>
                <CardDescription>
                  <Badge className={cn("mt-2", isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>
                    {isActive ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form action={async (formData: FormData) => {
                await updateProfile(formData);
                setIsEditing(false);
              }}>
                <input type="hidden" name="id" value={profile.id} />
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="nama_donatur">Nama Donatur</Label>
                    <Input id="nama_donatur" name="nama_donatur" defaultValue={profile.nama_donatur} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Simpan</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-sm">
                  <p><strong>Total Donasi:</strong> {formatCurrency(totalDonasi)}</p>
                  <p><strong>Jumlah Transaksi:</strong> {donations.length} kali</p>
                  <p><strong>Donasi Terakhir:</strong> {lastDonationDate ? format(lastDonationDate, 'd MMMM yyyy', { locale: id }) : 'Belum pernah'}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => setIsEditing(true)} className="cursor-pointer">Edit Profil</Button>
                    <Button variant="outline" asChild>
                        <Link href="/auth/forgot-password">Ganti Password</Link>
                    </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
            <DonationHistoryChart donations={donations} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Donasi</CardTitle>
          <CardDescription>Daftar semua donasi yang pernah Anda lakukan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length > 0 ? donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>{format(new Date(donation.tanggal_donasi), 'd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>{donation.keterangan || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(donation.jumlah)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">Belum ada riwayat donasi.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

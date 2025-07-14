'use client'

import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Tipe data untuk donasi
type RecentDonation = {
  nama_donatur: string;
  tanggal_donasi: string;
  jumlah: number;
};

// Fungsi untuk sensor nama
const censorName = (name: string) => {
  if (name.length <= 2) {
    return name;
  }
  return `${name.substring(0, 2)}****`;
};

// Fungsi untuk format mata uang
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(value);

// Fungsi untuk format tanggal
const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });


export default function NotificationBell() {
  const supabase = createClient();
  const [donations, setDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentDonations = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('donations')
          .select('nama_donatur, tanggal_donasi, jumlah')
          .order('tanggal_donasi', { ascending: false }) // Urutkan dari yang terbaru
          .limit(5); // Ambil 5 data teratas

        if (error) {
          throw new Error("Gagal mengambil data donasi terbaru.");
        }

        setDonations(data as RecentDonation[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDonations();
  }, [supabase]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Opsional: Tambahkan titik notifikasi jika ada donasi baru */}
          {donations.length > 0 && (
             <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Donasi Terbaru</h4>
            <p className="text-sm text-muted-foreground">
              Berikut adalah 5 donasi terakhir yang masuk.
            </p>
          </div>
          <div className="grid gap-2">
            {loading ? (
              <p className="text-sm text-center text-muted-foreground">Memuat...</p>
            ) : error ? (
              <p className="text-sm text-center text-red-500">{error}</p>
            ) : donations.length > 0 ? (
              donations.map((donation, index) => (
                <div key={index} className="flex items-start justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{censorName(donation.nama_donatur)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(donation.tanggal_donasi)}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(donation.jumlah)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground">Belum ada donasi.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
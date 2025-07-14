'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook

// Tipe untuk data donasi, dikembalikan seperti semula
type DonationDisplay = {
  id: number;
  tanggal_donasi: string;
  nama_donatur: string;
  jumlah: number;
  keterangan: string | null;
};

// Mengembalikan konstanta untuk paginasi
const ITEMS_PER_PAGE = 10; 

export default function DonationsPage() {
  const supabase = createClient();
  const [donations, setDonations] = useState<DonationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mengembalikan state untuk paginasi
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0); 

  // Menggunakan hook untuk reconnect
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

  const censorName = (name: string): string => {
    if (name.length <= 2) return name;
    return `${name.substring(0, 2)}...`;
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);

  // Memperbaiki fungsi fetch data dengan paginasi dan error handling
  const fetchDonations = useCallback(async (pageIndex: number) => {
    try {
      // Tidak set loading agar refresh lebih mulus, kecuali saat pertama kali
      // setLoading(true); 
      setError(null);

      const from = pageIndex * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // KEMBALIKAN QUERY SEPERTI SEMULA, tanpa filter status
      const { data, error, count } = await supabase
        .from('donations')
        .select('id, tanggal_donasi, nama_donatur, jumlah, keterangan', { count: 'exact' })
        .order('tanggal_donasi', { ascending: false })
        .range(from, to);
      
      if (error) throw new Error("Gagal mengambil data donasi.");

      setDonations(data as DonationDisplay[]);
      setTotalCount(count ?? 0);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase]); // Dependency hanya supabase

  // Efek untuk fetch data saat halaman berubah
  useEffect(() => {
    fetchDonations(page);
  }, [page, fetchDonations]);
  
  // Efek untuk real-time dan reconnect
  useEffect(() => {
    const handleDataChange = () => {
        // Jika ada perubahan, selalu fetch halaman pertama (0)
        // atau halaman saat ini jika Anda ingin tetap di halaman yang sama
        fetchDonations(page);
    };

    const channel = supabase.channel('donations-table-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, 
      handleDataChange
      )
      .subscribe();
      
    addReconnectListener(handleDataChange);
      
    return () => {
        supabase.removeChannel(channel);
        removeReconnectListener(handleDataChange);
    };
  }, [supabase, page, fetchDonations, addReconnectListener, removeReconnectListener]);

  const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rincian Donasi</CardTitle>
        <CardDescription>Daftar semua donasi yang telah tercatat.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Nama Donatur</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : error ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-red-500">{error}</TableCell></TableRow>
            ) : donations.length > 0 ? (
              donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>{format(new Date(donation.tanggal_donasi), 'd MMMM yyyy', { locale: id })}</TableCell>
                  <TableCell>{censorName(donation.nama_donatur)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{donation.keterangan || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(donation.jumlah)}</TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Belum ada data donasi.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {/* Mengembalikan UI Paginasi */}
      <CardFooter>
        <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
                Halaman {page + 1} dari {pageCount}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                    disabled={page === 0}
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page >= pageCount - 1}
                >
                    Berikutnya
                </Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
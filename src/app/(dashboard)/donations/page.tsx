'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRealtimeStatus } from '@/context/realtime-context';

// Tipe untuk data donasi
type DonationDisplay = {
  id: number;
  tanggal_donasi: string;
  nama_donatur: string;
  jumlah: number;
  keterangan: string | null;
};

// Konstanta untuk paginasi
const ITEMS_PER_PAGE = 10; 

export default function DonationsPage() {
  const supabase = createClient();
  const [donations, setDonations] = useState<DonationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk paginasi
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

  // Fungsi fetch data dengan paginasi dan error handling
  const fetchDonations = useCallback(async (pageIndex: number) => {
    try {
      setError(null);

      const from = pageIndex * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

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
  }, [supabase]);

  // Efek untuk fetch data saat halaman berubah
  useEffect(() => {
    fetchDonations(page);
  }, [page, fetchDonations]);
  
  // Efek untuk real-time dan reconnect
  useEffect(() => {
    const handleDataChange = () => {
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
        {/*
          PERUBAHAN UTAMA:
          - Menghapus div pembungkus.
          - Menambahkan `table-fixed` dan `w-full` ke komponen <Table>.
        */}
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              {/* Anda bisa mengatur lebar kolom secara manual jika perlu */}
              <TableHead className="w-[25%]">Tanggal</TableHead>
              <TableHead className="w-[20%]">Donatur</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right w-[25%]">Jumlah</TableHead>
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
                  <TableCell>{format(new Date(donation.tanggal_donasi), 'd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>{censorName(donation.nama_donatur)}</TableCell>
                  {/*
                    PERUBAHAN UTAMA:
                    - Menggunakan `break-words` agar teks keterangan tidak merusak layout.
                  */}
                  <TableCell className="break-words">{donation.keterangan || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(donation.jumlah)}</TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Belum ada data donasi.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {/* Footer tetap responsif */}
      <CardFooter>
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
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
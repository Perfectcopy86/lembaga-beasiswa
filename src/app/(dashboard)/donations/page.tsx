'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from "react-day-picker";

// Komponen UI & Utilitas
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- PERUBAHAN: Impor hook useMediaQuery ---
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

// Logika & Tipe Data
import { createClient } from "@/lib/supabase/client";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRealtimeStatus } from '@/context/realtime-context';
import { DonasiWithRelations } from '@/lib/types';

const ITEMS_PER_PAGE = 10;

export default function DonationsPage() {
  const supabase = createClient();
  const [donations, setDonations] = useState<DonasiWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  // --- PERUBAHAN: Gunakan hook untuk mendeteksi layar desktop (lebar > 768px) ---
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

  // (Fungsi-fungsi helper seperti censorName, formatCurrency, getGroupedItems tetap sama)
  const censorName = (name: string): string => {
    if (name.length <= 2) return name;
    return `${name.substring(0, 2)}...`;
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);

  const getGroupedItems = (items: DonasiWithRelations['donation_items']) => {
    if (!items) return [];
    const grouped = items.reduce((acc, item) => {
      const key = item.kategori_id;
      if (!acc[key]) {
        acc[key] = {
          name: item.kategori_beasiswa?.nama_kategori || 'N/A',
          count: 0,
        };
      }
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { name: string; count: number }>);
    return Object.values(grouped);
  };

  const fetchDonations = useCallback(async (pageIndex: number) => {
    try {
      setLoading(true);
      setError(null);
      const from = pageIndex * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase
        .from('donations')
        .select('*, donation_items(*, kategori_beasiswa(nama_kategori))', { count: 'exact' });
      if (date?.from) {
        query = query.gte('tanggal_donasi', date.from.toISOString());
      }
      if (date?.to) {
        query = query.lte('tanggal_donasi', date.to.toISOString());
      }
      const { data, error: queryError, count } = await query
        .order('tanggal_donasi', { ascending: false })
        .range(from, to);
      if (queryError) throw new Error("Gagal mengambil data donasi.");
      setDonations(data as DonasiWithRelations[]);
      setTotalCount(count ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase, date]);

  useEffect(() => {
    if (page !== 0) {
        setPage(0);
    }
  }, [date]);

  useEffect(() => {
    fetchDonations(page);
  }, [page, fetchDonations]);
  
  useEffect(() => {
    const handleDataChange = () => { fetchDonations(page); };
    const channel = supabase.channel('donations-table-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, handleDataChange)
      .subscribe();
    addReconnectListener(handleDataChange);
    return () => {
        supabase.removeChannel(channel);
        removeReconnectListener(handleDataChange);
    };
  }, [supabase, page, fetchDonations, addReconnectListener, removeReconnectListener]);

  const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // --- PERUBAHAN: Fungsi untuk render list donasi di mobile ---
  const renderMobileDonationCards = () => (
    <div className="space-y-4">
      {donations.map((donation) => (
        <div key={donation.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-sm font-semibold">{donation.is_anonymous ? censorName(donation.nama_donatur) : donation.nama_donatur}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(donation.tanggal_donasi), 'd MMM yyyy', { locale: id })}</p>
            </div>
            <p className="text-lg font-bold text-primary whitespace-nowrap">{formatCurrency(donation.jumlah)}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Detail Donasi</p>
            <div className="flex flex-wrap gap-1">
              {getGroupedItems(donation.donation_items).map((groupedItem, index) => (
                <Badge key={index} variant="secondary">
                  {groupedItem.count > 1 && `${groupedItem.count}x `}{groupedItem.name}
                </Badge>
              ))}
            </div>
          </div>
          {donation.keterangan && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">Keterangan</p>
              <p className="text-sm">{donation.keterangan}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <CardTitle>Rincian Donasi</CardTitle>
                <CardDescription>Daftar semua donasi yang telah tercatat.</CardDescription>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full md:w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? (<>{format(date.from, "d MMM yyyy", { locale: id })} - {format(date.to, "d MMM yyyy", { locale: id })}</>) : (format(date.from, "d MMM yyyy", { locale: id }))) : (<span>Pilih rentang tanggal</span>)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        // --- PERUBAHAN: Tampilkan 1 bulan di mobile, 2 di desktop ---
                        numberOfMonths={isDesktop ? 2 : 1}
                        locale={id}
                    />
                </PopoverContent>
            </Popover>
        </div>
      </CardHeader>
      
      {/* --- PERUBAHAN: Render Tampilan berdasarkan ukuran layar --- */}
      <CardContent>
        {isDesktop ? (
          // Tampilan Tabel untuk Desktop
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">Tanggal</TableHead>
                <TableHead className="w-[20%]">Donatur</TableHead>
                <TableHead>Detail Donasi/Kategori</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right w-[20%]">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? ( <TableRow><TableCell colSpan={5} className="h-24 text-center">Memuat data...</TableCell></TableRow> ) : 
               error ? ( <TableRow><TableCell colSpan={5} className="h-24 text-center text-red-500">{error}</TableCell></TableRow> ) : 
               donations.length > 0 ? (
                donations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>{format(new Date(donation.tanggal_donasi), 'd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell>{donation.is_anonymous ? censorName(donation.nama_donatur) : donation.nama_donatur}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getGroupedItems(donation.donation_items).map((groupedItem, index) => (
                          <Badge key={index} variant="secondary">{groupedItem.count > 1 && `${groupedItem.count}x `}{groupedItem.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{donation.keterangan}</TableCell>
                    <TableCell className="text-right">{formatCurrency(donation.jumlah)}</TableCell>
                  </TableRow>
                ))
               ) : ( <TableRow><TableCell colSpan={5} className="h-24 text-center">Tidak ada data donasi untuk rentang tanggal ini.</TableCell></TableRow> )}
            </TableBody>
          </Table>
        ) : (
          // Tampilan Kartu untuk Mobile
          <>
            {loading ? ( <div className="h-24 text-center flex items-center justify-center">Memuat data...</div> ) : 
             error ? ( <div className="h-24 text-center text-red-500 flex items-center justify-center">{error}</div> ) : 
             donations.length > 0 ? ( renderMobileDonationCards() ) : 
             ( <div className="h-24 text-center flex items-center justify-center">Tidak ada data donasi untuk rentang tanggal ini.</div> )}
          </>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <div className="text-xs text-muted-foreground"> Halaman {page + 1} dari {pageCount} </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.max(0, prev - 1))} disabled={page === 0}>Sebelumnya</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(prev => prev + 1)} disabled={page >= pageCount - 1}>Berikutnya</Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
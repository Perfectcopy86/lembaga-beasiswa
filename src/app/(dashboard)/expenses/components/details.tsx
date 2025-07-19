'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRealtimeStatus } from '@/context/realtime-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ExpenseDetail = {
  id: number;
  tanggal: string;
  penerima: string;
  deskripsi: string | null;
  jumlah: number;
  kategori: string;
  metode: string;
  bukti: string | null;
};

export default function DetailsTab() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  
  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
        .from('expenses')
        .select('id, tanggal, penerima, deskripsi, jumlah, kategori, metode, bukti')
        .order('tanggal', { ascending: false });
    
    if (error) {
        console.error("Gagal mengambil detail pengeluaran:", error);
    } else {
        setExpenses(data || []);
    }
    setLoading(false);
  }, [supabase]);
  
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('expense-details-realtime-reconnect')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        fetchData
      )
      .subscribe();

    addReconnectListener(fetchData);

    return () => {
      supabase.removeChannel(channel);
      removeReconnectListener(fetchData);
    };
  }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchSearch = search === "" ||
        expense.penerima.toLowerCase().includes(search.toLowerCase()) ||
        expense.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
        expense.kategori.toLowerCase().includes(search.toLowerCase());

      if (!dateRange?.from) return matchSearch;

      const expenseDate = new Date(expense.tanggal);
      const matchDate = expenseDate >= dateRange.from && (dateRange.to ? expenseDate <= dateRange.to : true);

      return matchSearch && matchDate;
    });
  }, [expenses, search, dateRange]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
                placeholder="Cari (penerima, deskripsi, kategori)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />
            <Popover>
                <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <> {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")} </>
                    ) : (format(dateRange.from, "LLL dd, y"))
                    ) : (<span>Pilih rentang tanggal</span>)}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
            <Button variant="ghost" onClick={() => { setSearch(""); setDateRange(undefined); }}>Reset</Button>
        </div>
        {/* --- AWAL PERUBAHAN UNTUK RESPONSIVE --- */}
        <div className="rounded-md border relative w-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Bukti</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Memuat...</TableCell></TableRow>
                    ) : filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell>{format(new Date(expense.tanggal), 'd MMM yyyy', { locale: id })}</TableCell>
                            <TableCell className="font-medium">{expense.penerima}</TableCell>
                            <TableCell><Badge variant="secondary">{expense.kategori}</Badge></TableCell>
                            <TableCell>{expense.deskripsi || '-'}</TableCell>
                            <TableCell>{expense.metode || '-'}</TableCell>
                            <TableCell>
                              {expense.bukti ? (
                                <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedImage(expense.bukti)}
                                className="cursor-pointer"
                              >
                                Lihat
                              </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(expense.jumlah)}</TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center">Tidak ada data yang cocok.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
        {/* --- AKHIR PERUBAHAN UNTUK RESPONSIVE --- */}
      </CardContent>
       <Dialog open={!!selectedImage} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedImage(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bukti Transaksi</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="mt-4">
              <img 
                src={selectedImage} 
                alt="Bukti Transaksi" 
                className="w-full h-auto rounded-md object-contain max-h-[80vh]" 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
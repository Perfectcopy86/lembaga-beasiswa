// src/app/admin/expenses/page.tsx
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react'; // 1. Impor useCallback

import { createClient } from '@/lib/supabase/client';
import { deleteExpense, saveExpense } from './actions';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRealtimeStatus } from '@/context/realtime-context'; // 2. Impor hook status

type ExpenseFromDB = {
  id: number;
  penerima: string;
  metode: string; 
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: number;
  bukti: string | null;
};

// Kategori ini nantinya akan dikelola di halaman Pengaturan
const expenseCategories = [
    "Suksesi 1",
    "Suksesi 2",
    "Suksesi 3",
    "UKT 1",
    "UKT 2",
    "UKT 3",
    
];
// Kategori ini nantinya akan dikelola di halaman Pengaturan
const expenseCategoriesMetode = [
    "Transfer Bank",
    "E-Wallet",
];

export default function AdminExpensesPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<ExpenseFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseFromDB | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: unknown } | null>(null);

  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus(); // 3. Gunakan hook
  // --- 2. Tambahkan state untuk mengontrol modal gambar ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(value);

  // 4. Bungkus fetchExpenses dengan useCallback agar referensinya stabil
  const fetchExpenses = useCallback(async () => {
    // Tidak set loading ke true di sini agar refresh tidak menampilkan "Memuat..."
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('tanggal', { ascending: false });
    setExpenses(data || []);
    setLoading(false); // Hanya set false setelah fetch pertama kali
  }, [supabase]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
  
  // Realtime listener untuk perubahan data
  useEffect(() => {
    const channel = supabase
      .channel('realtime-expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          // Refresh data saat ada perubahan
          fetchExpenses();
        }
      )
      .subscribe();

    // 5. Daftarkan dan bersihkan listener untuk re-koneksi
    addReconnectListener(fetchExpenses);

    return () => {
      supabase.removeChannel(channel);
      removeReconnectListener(fetchExpenses);
    };
  }, [supabase, fetchExpenses, addReconnectListener, removeReconnectListener]);

  const handleAdd = () => {
    setSelectedExpense(null);
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (expense: ExpenseFromDB) => {
    setSelectedExpense(expense);
    setFormMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, bukti?: string | null) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      startTransition(async () => {
        await deleteExpense(id, bukti);
      });
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormMessage(null);
    startTransition(async () => {
        const result = await saveExpense(formData);
        if (result.success) {
            setFormMessage({ type: 'success', text: result.message });
            setTimeout(() => {
              setIsModalOpen(false)
              setFormMessage(null)
            }, 1500);
        } else {
            setFormMessage({ type: 'error', text: result.message });
        }
    });
  };

  const filteredExpenses = expenses.filter((e) =>
    e.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
    e.penerima.toLowerCase().includes(search.toLowerCase()) ||
    e.kategori.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Pengeluaran</CardTitle>
            <CardDescription>Tambah, edit, atau hapus data pengeluaran.</CardDescription>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2 cursor-pointer">
            <PlusCircle size={18} />
            Tambah Pengeluaran
          </Button>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Cari deskripsi, penerima, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm mb-4"
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Bukti</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">Memuat...</TableCell></TableRow>
                ) : filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.tanggal), 'd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell className="font-medium">{expense.penerima}</TableCell>
                      <TableCell>{expense.deskripsi}</TableCell>
                      <TableCell><span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{expense.kategori}</span></TableCell>
                      <TableCell>{expense.metode}</TableCell>
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
                      <TableCell className="text-right font-mono">{formatCurrency(expense.jumlah)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(expense)} className="cursor-pointer"><Edit className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(expense.id, expense.bukti)} disabled={isPending}className="cursor-pointer"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">Tidak ada data pengeluaran.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* --- 4. Tambahkan komponen Dialog di sini --- */}
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

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedExpense && <input type="hidden" name="id" value={selectedExpense.id} />}
              {selectedExpense?.bukti && <input type="hidden" name="current_bukti" value={selectedExpense.bukti} />}
              <div className="space-y-1">
                <Label htmlFor="penerima">Penerima</Label>
                <Input id="penerima" name="penerima" defaultValue={selectedExpense?.penerima || ''} required/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Input id="deskripsi" name="deskripsi" defaultValue={selectedExpense?.deskripsi || ''} required/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                <Input id="jumlah" name="jumlah" type="number" defaultValue={selectedExpense?.jumlah || ''} required/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input id="tanggal" name="tanggal" type="date" defaultValue={selectedExpense ? format(new Date(selectedExpense.tanggal), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} required/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="kategori">Kategori</Label>
                <Select name="kategori" defaultValue={selectedExpense?.kategori} required>
                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                    <SelectContent>
                        {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="metode">Metode</Label>
                <Select name="metode" defaultValue={selectedExpense?.metode} required>
                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Pilih metode..." /></SelectTrigger>
                    <SelectContent>
                        {expenseCategoriesMetode.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bukti-transaksi">Bukti Transaksi</Label>
                <Input id="bukti-transaksi" name="bukti-transaksi" type="file" />
                {selectedExpense?.bukti && <p className="text-xs text-muted-foreground pt-1">Kosongkan jika tidak ingin mengubah bukti.</p>}
              </div>
            </div>
            {formMessage && (
                <div className={`text-sm p-2 rounded-md mb-4 ${formMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {String(formMessage.text)}
                </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary" className="cursor-pointer">Batal</Button></DialogClose>
              <Button type="submit" disabled={isPending}className="cursor-pointer">{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
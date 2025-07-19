'use client';

import { useTransition } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KategoriBeasiswa, DonasiWithRelations } from '@/lib/types';
import { deleteDonation } from './actions';
import { toast } from 'sonner';
import { DonationDialog } from './DonationDialog';
import { Pencil, Trash2 } from 'lucide-react';

type DonationsTableProps = {
  donations: DonasiWithRelations[];
  kategoriBeasiswa: KategoriBeasiswa[];
  onDataChange: () => void;
};

export function DonationsTable({ donations, kategoriBeasiswa, onDataChange  }: DonationsTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: number) => {
    // Ganti window.confirm dengan dialog kustom jika memungkinkan
    if (confirm('Apakah Anda yakin ingin menghapus donasi ini? Semua alokasi terkait akan ikut terhapus.')) {
      startTransition(async () => {
        const result = await deleteDonation(id);
        if (result?.error) {
          toast.error('Gagal menghapus donasi', { description: result.error });
        } else {
          toast.success('Donasi berhasil dihapus!');
          onDataChange();
        }
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Fungsi untuk mengelompokkan item dan menghitung kuantitas untuk tampilan
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
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Tanggal Donasi</TableHead>
          <TableHead>Nama Donatur</TableHead>
          <TableHead>Detail Donasi/Kategori</TableHead>
          <TableHead className="text-right">Jumlah Total</TableHead>
          <TableHead className="w-[120px]">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donations && donations.length > 0 ? (
          donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell>
                {new Date(donation.tanggal_donasi).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </TableCell>
              <TableCell className="font-medium">{donation.nama_donatur}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {getGroupedItems(donation.donation_items).map((groupedItem, index) => (
                    <Badge key={index} variant="secondary">
                      {groupedItem.count}x {groupedItem.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(donation.jumlah)}</TableCell>
              <TableCell className="flex gap-2">
                <DonationDialog 
                  kategoriBeasiswa={kategoriBeasiswa} 
                  donation={donation}
                  onDataChange={onDataChange}
                >
                  <Button variant="outline" size="sm">
                     <Pencil className="h-4 w-4" />
                  </Button>
                </DonationDialog>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(donation.id)}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              Belum ada data donasi.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

'use client';

import { useTransition } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KategoriBeasiswa, DonasiWithRelations } from '@/lib/types';
import { deleteDonation } from './actions';
import { toast } from 'sonner';
import { DonationDialog } from './DonationDialog';
import { Pencil, Trash2, User, Calendar, DollarSign, Tag } from 'lucide-react';

type DonationsTableProps = {
  donations: DonasiWithRelations[];
  kategoriBeasiswa: KategoriBeasiswa[];
  userProfiles: { id: string; nama_donatur: string }[];
  onDataChange: () => void;
};

export function DonationsTable({ donations, kategoriBeasiswa, userProfiles, onDataChange  }: DonationsTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: number) => {
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
  
  const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
      });
  }

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

  if (!donations || donations.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-center">
        Belum ada data donasi.
      </div>
    );
  }

  return (
    <>
      {/* Tampilan Mobile: Daftar Kartu (Tidak Berubah) */}
      <div className="grid gap-4 md:hidden">
        {donations.map((donation) => (
          <Card key={donation.id} className="w-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-lg font-bold">{donation.nama_donatur}</span>
                <div className="flex gap-2 shrink-0">
                  <DonationDialog 
                      kategoriBeasiswa={kategoriBeasiswa} 
                      donation={donation}
                      userProfiles={userProfiles}
                      onDataChange={onDataChange}
                  >
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                    </Button>
                  </DonationDialog>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(donation.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <Calendar className="h-4 w-4" />
                 <span>{formatDate(donation.tanggal_donasi)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {donation.profiles && (
                  <div className="flex items-center gap-2 text-sm">
                     <User className="h-4 w-4 text-muted-foreground" />
                     <span className="font-medium">Terkait: {donation.profiles.nama_donatur}</span>
                  </div>
              )}
               <div className="flex items-center gap-2 text-sm">
                     <DollarSign className="h-4 w-4 text-muted-foreground" />
                     <span className="font-semibold text-base">{formatCurrency(donation.jumlah)}</span>
                </div>
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {getGroupedItems(donation.donation_items).map((item, index) => (
                   <Badge key={index} variant="secondary">{item.count}x {item.name}</Badge>
                ))}
              </div>
               {/* {donation.is_anonymous && <Badge variant="outline">Donasi Anonim</Badge>} */}
               {donation.is_anonymous ? (
                    <Badge variant="default">Donasi Anonim</Badge>
                  ) : (
                    <Badge variant="secondary">Tidak</Badge>
                  )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tampilan Desktop: Tabel (Sudah Diperbaiki) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Tanggal</TableHead>
              <TableHead>Nama Donatur</TableHead>
              <TableHead>Pengguna Terkait</TableHead>
              {/* --- DIKEMBALIKAN --- */}
              <TableHead>Status Anonim</TableHead>
              <TableHead>Detail Donasi</TableHead>
              <TableHead className="text-right">Jumlah Total</TableHead>
              <TableHead className="w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell>{formatDate(donation.tanggal_donasi)}</TableCell>
                <TableCell className="font-medium">{donation.nama_donatur}</TableCell>
                <TableCell>
                  {donation.profiles ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{donation.profiles.nama_donatur}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {/* --- DIKEMBALIKAN --- */}
                <TableCell>
                  {donation.is_anonymous ? (
                    <Badge variant="outline">Ya, Anonim</Badge>
                  ) : (
                    <Badge variant="secondary">Tidak</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getGroupedItems(donation.donation_items).map((item, index) => (
                      <Badge key={index} variant="secondary">{item.count}x {item.name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(donation.jumlah)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <DonationDialog 
                        kategoriBeasiswa={kategoriBeasiswa} 
                        donation={donation}
                        userProfiles={userProfiles}
                        onDataChange={onDataChange}
                    >
                      <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button>
                    </DonationDialog>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(donation.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeStatus } from '@/context/realtime-context';

import { type UserWithStats } from './page';
import { updateUserRole } from './actions';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// 1. Update props untuk menerima status error dari server
export function UsersTable({ users: initialUsers, error }: { users: UserWithStats[], error: string | null }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  const router = useRouter();
  const { status } = useRealtimeStatus();

  // Hook ini sudah benar dan akan berjalan sekarang karena komponen ini selalu dirender
  useEffect(() => {
    // Hanya refresh jika status berubah menjadi SUBSCRIBED, menandakan koneksi pulih.
    if (status === 'SUBSCRIBED') {
      console.log('Koneksi pulih, memuat ulang data pengguna...');
      router.refresh();
    }
  }, [status, router]);
  
  // Sinkronkan state jika props dari server berubah (setelah refresh berhasil)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleEditRole = (user: UserWithStats) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const handleRoleChangeSubmit = () => {
    if (!selectedUser) return;

    startTransition(async () => {
      await updateUserRole({ userId: selectedUser.id, newRole });
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === selectedUser.id ? {...u, role: newRole} : u)
      );
      setIsModalOpen(false);
    });
  };

  // 2. Tampilkan pesan error dan status auto-retry jika ada masalah pada load awal
  if (error && initialUsers.length === 0) {
    return (
      <div className="text-center py-10 rounded-lg border bg-card text-card-foreground shadow-sm">
        <p className="font-semibold">Terjadi Kesalahan</p>
        <p className="text-sm">Gagal memuat data pengguna.</p>
        <p className="text-xs text-muted-foreground mt-1">Detail: {error}</p>
        <p className="mt-4 text-sm text-primary animate-pulse">
          Mencoba menyambungkan kembali secara otomatis...
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.nama_donatur.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Input
        placeholder="Cari nama atau email pengguna..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pengguna</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Donasi</TableHead>
              <TableHead>Status Keaktifan</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nama_donatur}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  {formatCurrency(user.total_donasi)} ({user.jumlah_transaksi}x)
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    'text-xs font-medium px-2 py-1',
                    user.donationStatus === 'Aktif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {user.donationStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="icon" onClick={() => handleEditRole(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Edit Role */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
            <DialogDescription>
              Anda akan mengubah role untuk pengguna: <span className="font-semibold">{selectedUser?.nama_donatur}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role-select">Pilih Role Baru</Label>
            <Select value={newRole} onValueChange={(value: 'admin' | 'user') => setNewRole(value)}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Pilih role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
            <Button onClick={handleRoleChangeSubmit} disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
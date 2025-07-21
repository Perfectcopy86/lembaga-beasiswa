// donations/DonationDialog.tsx
'use client';

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DonationForm } from './DonationForm';
import { KategoriBeasiswa, DonasiWithRelations } from '@/lib/types';

type UserProfile = {
  id: string;
  nama_donatur: string;
};

type DonationDialogProps = {
  kategoriBeasiswa: KategoriBeasiswa[];
  userProfiles: UserProfile[];
  donation?: DonasiWithRelations; 
  children?: ReactNode; 
  onDataChange?: () => void;
};

export function DonationDialog({ kategoriBeasiswa, userProfiles, donation, children, onDataChange }: DonationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleFormSubmit = () => {
    setOpen(false); 
    if (onDataChange) {
        onDataChange();
      }
  };

  const isEditMode = !!donation;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="cursor-pointer">
        {children ? children : <Button>+ Tambah Donasi Baru</Button>}
      </DialogTrigger>
      {/* Tambahkan max-h-[85vh] dan overflow-y-auto */}
      <DialogContent className="w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Donasi' : 'Formulir Donasi Baru'}</DialogTitle>
        </DialogHeader>
        <DonationForm
          kategoriBeasiswa={kategoriBeasiswa}
          userProfiles={userProfiles}
          onFormSubmit={handleFormSubmit}
          donation={donation} 
        />
      </DialogContent>
    </Dialog>
  );
}
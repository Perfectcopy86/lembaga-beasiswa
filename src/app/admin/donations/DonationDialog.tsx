// donations/DonationDialog.tsx

'use client';

import { useState, ReactNode } from 'react'; // Import ReactNode
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DonationForm } from './DonationForm';
import { KategoriBeasiswa, DonasiWithRelations } from '@/lib/types'; // Import DonasiWithRelations


type DonationDialogProps = {
  kategoriBeasiswa: KategoriBeasiswa[];
  donation?: DonasiWithRelations; 
  children?: ReactNode; 
  onDataChange?: () => void; // TAMBAH: Definisikan tipe untuk prop baru
};

export function DonationDialog({ kategoriBeasiswa, donation, children, onDataChange }: DonationDialogProps) {
  const [open, setOpen] = useState(false);

  
  const handleFormSubmit = () => {
    setOpen(false); 
    if (onDataChange) {
        onDataChange(); // PANGGIL: Panggil fungsi refresh data jika ada
      }
  };

  const isEditMode = !!donation;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="cursor-pointer">
        
        {children ? children : <Button>+ Tambah Donasi Baru</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
        
          <DialogTitle>{isEditMode ? 'Edit Donasi' : 'Formulir Donasi Baru'}</DialogTitle>
        </DialogHeader>
        <DonationForm
          kategoriBeasiswa={kategoriBeasiswa}
          onFormSubmit={handleFormSubmit}
          donation={donation} 
        />
      </DialogContent>
    </Dialog>
  );
}
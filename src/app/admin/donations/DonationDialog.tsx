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


// --- PERUBAHAN DIMULAI ---

// Definisikan tipe untuk user profile agar komponen ini tahu bentuk datanya
type UserProfile = {
  id: string;
  nama_donatur: string;
};

type DonationDialogProps = {
  kategoriBeasiswa: KategoriBeasiswa[];
  userProfiles: UserProfile[]; // Tambahkan prop userProfiles
  donation?: DonasiWithRelations; 
  children?: ReactNode; 
  onDataChange?: () => void;
};

export function DonationDialog({ kategoriBeasiswa, userProfiles, donation, children, onDataChange }: DonationDialogProps) {
// --- PERUBAHAN SELESAI ---
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
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
        
          <DialogTitle>{isEditMode ? 'Edit Donasi' : 'Formulir Donasi Baru'}</DialogTitle>
        </DialogHeader>
        {/* --- PERUBAHAN DIMULAI --- */}
        <DonationForm
          kategoriBeasiswa={kategoriBeasiswa}
          userProfiles={userProfiles} // Teruskan prop userProfiles ke DonationForm
          onFormSubmit={handleFormSubmit}
          donation={donation} 
        />
        {/* --- PERUBAHAN SELESAI --- */}
      </DialogContent>
    </Dialog>
  );
}
'use client'

import type { User } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { logout } from '@/app/auth/actions';

type Profile = {
  nama_donatur: string;
} | null;

interface UserNavClientProps {
  user: User | null;
  profile: Profile;
}

export function UserNavClient({ user, profile }: UserNavClientProps) {
  // Jika tidak ada user, tampilkan tombol Login
  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/auth">Login</Link>
      </Button>
    );
  }

  // Jika ada user, siapkan data untuk ditampilkan
  const userName = profile?.nama_donatur || 'Pengguna';
  const userEmail = user.email || '';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profil</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Form untuk memanggil server action logout */}
        <form action={logout} className="w-full">
            <button type="submit" className="w-full text-left">
                <DropdownMenuItem>
                    Logout
                </DropdownMenuItem>
            </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
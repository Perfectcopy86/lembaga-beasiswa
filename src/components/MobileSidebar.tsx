'use client';

import Link from 'next/link';
import Image from 'next/image'; // Impor komponen Image
import {
  Home,
  Package,
  ShoppingCart,
  Users2,
  Settings,
  FileText,
  HandCoins,
  PersonStanding,
  Receipt,
  PanelLeft,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export function MobileSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const navItems = isAdmin
    ? [
        { href: '/admin', icon: Home, label: 'Dashboard' },
        { href: '/admin/donations', icon: Package, label: 'Manajemen Donasi' },
        { href: '/admin/allocations', icon: HandCoins, label: 'Alokasi Dana' },
        { href: '/admin/map', icon: PersonStanding, label: 'Peta Beswan' },
        { href: '/admin/expenses', icon: Receipt, label: 'Manajemen Pengeluaran' },
        { href: '/admin/users', icon: Users2, label: 'Manajemen Pengguna' },
        { href: '/admin/reports', icon: FileText, label: 'Laporan' },
        { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
      ]
    : [
        { href: '/home', icon: Home, label: 'Home' },
        { href: '/donations', icon: Package, label: 'Rincian Donasi' },
        { href: '/expenses', icon: ShoppingCart, label: 'Pengeluaran' },
        { href: '/profile', icon: Users2, label: 'Profil' },
      ];

  const logoAndTitle = isAdmin ? (
    <div className="flex flex-col">
      <span className="text-base leading-tight">Admin Panel</span>
      <span className="text-sm leading-tight text-muted-foreground">IKA UPI</span>
    </div>
  ) : (
    <div className="flex flex-col">
      <span className="text-base leading-tight">Lembaga Beasiswa</span>
      <span className="text-base leading-tight">IKA UPI</span>
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          {/* === BAGIAN YANG DIPERBARUI === */}
          <Link
            href={isAdmin ? "/admin" : "/home"}
            className="flex items-center gap-3 px-2.5 font-semibold text-foreground"
          >
            <Image
                src="https://i.ibb.co/tPQXRfjK/Logo-Beasiswa-IKA-UPI-PNG-bulat.png" // <-- GANTI DENGAN LINK ANDA
                alt="Logo Lembaga Beasiswa IKA UPI"
                width={32} 
                height={32} 
                className="transition-all group-hover:scale-110"
            />
            {logoAndTitle}
          </Link>
          {/* ============================= */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-2.5 ${
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
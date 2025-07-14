// src/components/header-client-actions.tsx
'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  Menu,
  Package,
  ShoppingCart,
  Users2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { LangToggle } from './lang-toggle';
import NotificationBell from './NotificationBell';
import LiveIndicator from './live-indicator'; // <-- Impor komponen baru

export function HeaderClientActions() {
    const pathname = usePathname();
    const navItems = [
        { href: '/home', icon: Home, label: 'Home' },
        { href: '/donations', icon: Package, label: 'Rincian Donasi' },
        { href: '/expenses', icon: ShoppingCart, label: 'Pengeluaran' },
        { href: '/profile', icon: Users2, label: 'Profil' },
    ];

    return (
        <>
            {/* ... (kode menu mobile tidak berubah) ... */}

            {/* Tombol ganti bahasa dan tema */}
            <LiveIndicator /> {/* <-- Tambahkan komponen di sini */}
            <NotificationBell />
            {/* <LangToggle /> */}
            <ThemeToggle />
        </>
    )
}
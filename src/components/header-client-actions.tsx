// src/components/header-client-actions.tsx
'use client'


import {
  Home,
  Menu,
  Package,
  ShoppingCart,
  Users2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import NotificationBell from './NotificationBell';
import LiveIndicator from './live-indicator'; // <-- Impor komponen baru

export function HeaderClientActions() {

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
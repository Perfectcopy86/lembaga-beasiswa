// src/components/header-client-actions.tsx
'use client'

import { ThemeToggle } from './theme-toggle';
import NotificationBell from './NotificationBell';
import LiveIndicator from './live-indicator';

export function HeaderClientActions() {

    return (
        <>
            {/* ... (kode menu mobile tidak berubah) ... */}

            {/* Tombol ganti bahasa dan tema */}
            <LiveIndicator />
            <NotificationBell />
            {/* <LangToggle /> */}
            <ThemeToggle />
        </>
    )
}
// src/app/(dashboard)/main-container.tsx
'use client';

import React from 'react';
import { useSidebar } from '@/context/sidebar-context';
import { cn } from '@/lib/utils';

export function MainContainer({ children }: { children: React.ReactNode }) {
    const { isSidebarExpanded } = useSidebar();

    return (
        <div className={cn(
            "flex flex-col sm:gap-4 sm:py-4 transition-[padding-left] duration-300 ease-in-out",
            isSidebarExpanded ? "sm:pl-64" : "sm:pl-14"
        )}>
            {children}
        </div>
    )
}
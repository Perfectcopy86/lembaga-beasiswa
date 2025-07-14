// src/app/admin/sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
    Home, 
    Package, 
    Users2, 
    ChevronLeft,
    Settings,
    FileText,
    HandCoins,
    PersonStanding,
    Receipt
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/sidebar-context';
import { Button } from '@/components/ui/button';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarExpanded, toggleSidebar } = useSidebar();

  const navItems = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/donations', icon: Package, label: 'Manajemen Donasi' },
    { href: '/admin/allocations', icon: HandCoins, label: 'Alokasi Dana' },
    { href: '/admin/map', icon: PersonStanding, label: 'Peta Beswan' },
    { href: '/admin/expenses', icon: Receipt, label: 'Manajemen Pengeluaran' },
    { href: '/admin/users', icon: Users2, label: 'Manajemen Pengguna' },
    { href: '/admin/reports', icon: FileText, label: 'Laporan' },
    { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
  ];

  return (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-[width] duration-300 ease-in-out",
        isSidebarExpanded ? "w-64" : "w-14"
    )}>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <div className={cn(
            "flex h-9 items-center transition-all duration-300 ease-in-out",
            isSidebarExpanded ? "w-full justify-start px-2" : "w-9 justify-center"
        )}>
            <Image
                src="https://i.ibb.co/tPQXRfjK/Logo-Beasiswa-IKA-UPI-PNG-bulat.png"
                alt="Logo Lembaga Beasiswa IKA UPI"
                width={32} 
                height={32} 
            />
            <div className={cn(
                "flex flex-col", 
                isSidebarExpanded ? "ml-3 opacity-100" : "w-0 opacity-0 sr-only"
            )}>
                <span className="whitespace-nowrap font-semibold">Admin Panel</span>
                <span className="whitespace-nowrap text-sm text-muted-foreground">IKA UPI</span>
            </div>
        </div>
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 w-full',
                    isSidebarExpanded ? "justify-start gap-3 px-3" : "justify-center",
                    {
                      'bg-accent text-accent-foreground': pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin'),
                    }
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn("truncate", isSidebarExpanded ? "block" : "sr-only")}>
                    {item.label}
                  </span>
                </Link>
              </TooltipTrigger>
              {!isSidebarExpanded && (
                <TooltipContent side="right">{item.label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
         <Button onClick={toggleSidebar} variant="outline" size="icon" className="h-9 w-9">
            <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", !isSidebarExpanded && "rotate-180")} />
         </Button>
      </nav>
    </aside>
  );
}

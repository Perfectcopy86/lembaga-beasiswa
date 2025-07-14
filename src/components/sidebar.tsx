'use client';

import Link from 'next/link';

import Image from 'next/image'; // 1. Impor komponen Image
import {
  Home,
  Package,
  Package2,
  Settings,
  ShoppingCart,
  Users2,
  ChevronLeft
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/sidebar-context';
import { Button } from './ui/button';

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarExpanded, toggleSidebar } = useSidebar();

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/donations', icon: Package, label: 'Rincian Donasi' },
    { href: '/expenses', icon: ShoppingCart, label: 'Pengeluaran' },
    { href: '/profile', icon: Users2, label: 'Profil' },
  ];

  return (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-[width] duration-300 ease-in-out",
        isSidebarExpanded ? "w-64" : "w-14"
    )}>
       {/* ===== AWAL BAGIAN YANG DIUBAH ===== */}
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <div className={cn(
            "flex h-9 items-center transition-all duration-300 ease-in-out",
            isSidebarExpanded ? "w-full justify-start px-2" : "w-9 justify-center"
        )}>
            <Image
                src="https://i.ibb.co/tPQXRfjK/Logo-Beasiswa-IKA-UPI-PNG-bulat.png" // <-- GANTI DENGAN LINK ANDA
                alt="Logo Lembaga Beasiswa IKA UPI"
                width={32} 
                height={32} 
                className="transition-all group-hover:scale-110"
            />
            <div className={cn(
                "flex flex-col", 
                isSidebarExpanded ? "ml-3 opacity-100" : "w-0 opacity-0 sr-only"
            )}>
                <span className="whitespace-nowrap font-semibold">Lembaga Beasiswa</span>
                <span className="whitespace-nowrap font-semibold">IKA UPI</span>
            </div>
        </div>
      {/* ===== AKHIR BAGIAN YANG DIUBAH ===== */}

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
                      'bg-accent text-accent-foreground': pathname.startsWith(item.href),
                    }
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn(
                      "truncate", 
                      isSidebarExpanded ? "block" : "sr-only"
                  )}>
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
         <Button 
            onClick={toggleSidebar} 
            variant="outline" 
            size="icon"
            className="h-9 w-9"
         >
            <ChevronLeft className={cn(
                "h-5 w-5 transition-transform duration-300 ease-in-out", 
                !isSidebarExpanded && "rotate-180"
            )} />
         </Button>
      </nav>
    </aside>
  );
}
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Package,
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
        "fixed inset-y-0 left-0 z-10 hidden sm:flex flex-col border-r transition-[width] duration-300 ease-in-out bg-sidebar text-sidebar-foreground",
        isSidebarExpanded ? "w-64" : "w-14"
    )}>
      {/* Header section */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border/50 h-[85px]",
        isSidebarExpanded ? "justify-between pl-3 pr-2" : "justify-center"
      )}>
        {/* Logo and Name Container (hidden on collapse) */}
        <div className={cn("flex items-center gap-2 overflow-hidden", !isSidebarExpanded && "hidden")}>
          <Image
            src="https://i.ibb.co/tPQXRfjK/Logo-Beasiswa-IKA-UPI-PNG-bulat.png"
            alt="Logo Lembaga Beasiswa IKA UPI"
            width={32}
            height={32}
            className="shrink-0"
          />
          <div className="flex flex-col">
            {/* ===== PERUBAHAN FONT DIMULAI DI SINI ===== */}
            <span className="whitespace-nowrap font-bold">Lembaga Beasiswa</span>
            <span className="whitespace-nowrap font-bold">IKA UPI</span>
            {/* ===== PERUBAHAN FONT SELESAI DI SINI ===== */}
          </div>
        </div>

        {/* Toggle Button (always visible in header) */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn(
            "h-5 w-5 transition-transform duration-300",
            !isSidebarExpanded && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Navigation Links */}
      {/* ===== PERUBAHAN PADDING DIMULAI DI SINI ===== */}
      <nav className="flex-grow space-y-6 px-2 pt-8">
      {/* ===== PERUBAHAN PADDING SELESAI DI SINI ===== */}
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 items-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-10 w-full',
                    isSidebarExpanded ? "justify-start gap-3 px-3" : "justify-center",
                    {
                      'bg-sidebar-accent text-sidebar-accent-foreground': pathname.startsWith(item.href),
                    }
                  )}
                >
                  <item.icon className="h-6 w-6" />
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
    </aside>
  );
}
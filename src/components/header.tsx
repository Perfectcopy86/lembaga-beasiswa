// src/components/header.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import Link from 'next/link';
import { HeaderClientActions } from "./header-client-actions";
import { UserNav } from './user-nav'; // Impor UserNav di sini
import { MobileSidebar } from "./MobileSidebar";

export default function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <MobileSidebar isAdmin={isAdmin} />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={isAdmin ? "/admin" : "/home"}>
                {isAdmin ? "Admin Dashboard" : "Dashboard Lembaga Beasiswa IKA UPI"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        <HeaderClientActions />
        <UserNav /> {/* Render UserNav di sini, di luar HeaderClientActions */}
      </div>
    </header>
  );
}
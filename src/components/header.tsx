import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from 'next/link';
import { HeaderClientActions } from "./header-client-actions";
import { UserNav } from './user-nav';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Dashboard Lembaga Beasiswa IKA UPI</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {/* Anda bisa menambahkan logika path dinamis di sini jika diperlukan,
              menggunakan fungsi dari server-side. */}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        {/* Pindahkan semua tombol interaktif ke komponen client */}
        <HeaderClientActions />
        <UserNav />
      </div>
    </header>
  );
}

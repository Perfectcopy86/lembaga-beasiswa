// src/app/admin/layout.tsx
import React from 'react';
import { SidebarProvider } from '@/context/sidebar-context';
import { MainContainer } from '@/app/(dashboard)/main-container';
import Header from '@/components/header';
import AdminSidebar from './sidebar';
import { RealtimeProvider } from '@/context/realtime-context'; // <-- Tambahkan impor ini

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Bungkus dengan RealtimeProvider di sini */}
      <RealtimeProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar />
          <MainContainer>
              <Header />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                  {children}
              </main>
          </MainContainer>
        </div>
      </RealtimeProvider>
    </SidebarProvider>
  );
}
// src/app/(dashboard)/layout.tsx
import React from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarProvider } from '@/context/sidebar-context';
import { MainContainer } from './main-container';
import Header from '@/components/header';
import { RealtimeProvider } from '@/context/realtime-context'; // <-- Impor provider baru

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Bungkus dengan RealtimeProvider di sini */}
      <RealtimeProvider> 
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <Sidebar />
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
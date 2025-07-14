'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tipe untuk context
interface SidebarContextType {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
}

// Buat context
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Buat Provider untuk membungkus aplikasi
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarExpanded, setSidebarExpanded] = useState(true); // Default sidebar terbuka

  const toggleSidebar = () => {
    setSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <SidebarContext.Provider value={{ isSidebarExpanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Buat custom hook untuk mempermudah penggunaan context
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
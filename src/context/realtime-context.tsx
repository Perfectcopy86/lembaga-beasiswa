'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Tipe untuk status koneksi
type RealtimeStatus = 'CONNECTING' | 'SUBSCRIBED' | 'RECONNECTING' | 'CLOSED' | 'CHANNEL_ERROR';

// 1. Tambahkan fungsi onReconnect ke dalam tipe context
interface RealtimeContextType {
  status: RealtimeStatus;
  addReconnectListener: (callback: () => void) => void;
  removeReconnectListener: (callback: () => void) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [status, setStatus] = useState<RealtimeStatus>('CONNECTING');
  // 2. Buat state untuk menyimpan daftar callback
  const [reconnectListeners, setReconnectListeners] = useState<(() => void)[]>([]);

  // 3. Buat fungsi untuk menambah dan menghapus listener
  const addReconnectListener = useCallback((callback: () => void) => {
    setReconnectListeners(prev => [...prev, callback]);
  }, []);

  const removeReconnectListener = useCallback((callback: () => void) => {
    setReconnectListeners(prev => prev.filter(cb => cb !== callback));
  }, []);


  useEffect(() => {
    const channel: RealtimeChannel = supabase.channel('realtime-status-monitor');

    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('SUBSCRIBED');
          // 4. Panggil semua listener saat berhasil terkoneksi/re-koneksi
          console.log("Realtime SUBSCRIBED, triggering reconnect listeners.");
          reconnectListeners.forEach(cb => cb());
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setStatus('CHANNEL_ERROR');
          setTimeout(() => setStatus('RECONNECTING'), 2000);
        } else if (status === 'CLOSED') {
            setStatus('CLOSED');
        }
      });
      
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // 5. Tambahkan reconnectListeners sebagai dependency
  }, [supabase, reconnectListeners]);

  return (
    // 6. Sediakan fungsi baru ke dalam provider
    <RealtimeContext.Provider value={{ status, addReconnectListener, removeReconnectListener }}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Custom hook untuk mempermudah penggunaan context
export function useRealtimeStatus() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeStatus must be used within a RealtimeProvider');
  }
  return context;
}
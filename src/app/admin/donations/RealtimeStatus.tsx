// src/app/admin/donations/RealtimeStatus.tsx

'use client'; // Direktif ini sekarang ada di paling atas berkas

import { useRealtimeStatus } from '@/context/realtime-context';
import { Badge } from '@/components/ui/badge';

export function RealtimeStatus() {
  const { status } = useRealtimeStatus();

  if (!status) return null;
  
  const isSubscribed = status === 'SUBSCRIBED';
  const color = isSubscribed ? 'bg-green-500' : 'bg-yellow-500';
  const text = isSubscribed ? 'Live' : status;

  return (
     <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`}></span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
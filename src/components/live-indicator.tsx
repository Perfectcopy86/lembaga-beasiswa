// src/components/live-indicator.tsx
'use client';

import React from 'react';
import { useRealtimeStatus } from '@/context/realtime-context';
import { cn } from '@/lib/utils';

export default function LiveIndicator() {
  const { status } = useRealtimeStatus();

  const getStatusInfo = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          text: 'Live',
          className: 'bg-green-500',
          ping: true,
        };
      case 'RECONNECTING':
        return {
          text: 'Reconnecting...',
          className: 'bg-yellow-500',
          ping: true,
        };
       case 'CONNECTING':
        return {
          text: 'Connecting...',
          className: 'bg-gray-400',
          ping: true,
        };
      case 'CLOSED':
      case 'CHANNEL_ERROR':
        return {
          text: 'Lost Connection',
          className: 'bg-red-500',
          ping: false,
        };
      default:
        return {
          text: 'Offline',
          className: 'bg-gray-500',
          ping: false,
        };
    }
  };

  const { text, className, ping } = getStatusInfo();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
      <span className="relative flex h-3 w-3">
        {ping && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", className)}></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-3 w-3", className)}></span>
      </span>
      <span>{text}</span>
    </div>
  );
}
// src/components/ui/retry-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

export function RetryButton() {
  const router = useRouter();

  return (
    <Button 
      variant="outline" 
      onClick={() => router.refresh()}
      className="mt-4"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Coba Lagi
    </Button>
  );
}
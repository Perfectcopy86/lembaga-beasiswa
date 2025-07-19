// src/app/admin/settings/components/activity-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { updateActivityThreshold } from '../actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ActivityThresholdForm({ defaultValue }: { defaultValue: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage('');
    startTransition(async () => {
      const result = await updateActivityThreshold(formData);
      setMessage(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="threshold_days">Batas Hari Tidak Aktif</Label>
        <Input id="threshold_days" name="threshold_days" type="number" defaultValue={defaultValue} required />
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" disabled={isPending}className="cursor-pointer">
        {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </Button>
    </form>
  );
}

// src/app/admin/settings/components/target-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { updateDonationTargets } from '../actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function TargetSettingsForm({ monthlyTarget, yearlyTarget }: { monthlyTarget: string, yearlyTarget: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage('');
    startTransition(async () => {
      const result = await updateDonationTargets(formData);
      setMessage(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="monthly_target">Target Bulanan (Rp)</Label>
        <Input id="monthly_target" name="monthly_target" type="number" defaultValue={monthlyTarget} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="yearly_target">Target Tahunan (Rp)</Label>
        <Input id="yearly_target" name="yearly_target" type="number" defaultValue={yearlyTarget} required />
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </form>
  );
}

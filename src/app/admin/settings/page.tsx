// src/app/admin/settings/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeStatus } from '@/context/realtime-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TargetSettingsForm } from './components/target-form';
import { ActivityThresholdForm } from './components/activity-form';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();
  const router = useRouter();

  // 1. Fungsi untuk mengambil data pengaturan dibungkus dengan useCallback
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: settingsData } = await supabase.from('app_settings').select('*');

    const newSettings = (settingsData || []).reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, string>);

    setSettings(newSettings);
    setLoading(false);
  }, []);

  // 2. Fungsi yang akan dipanggil saat koneksi kembali pulih
  //    router.refresh() akan memuat ulang data dari server.
  const handleReconnect = useCallback(() => {
    router.refresh();
  }, [router]);


  // 3. Menambahkan dan menghapus listener saat komponen mount dan unmount
  useEffect(() => {
    addReconnectListener(handleReconnect);
    return () => {
      removeReconnectListener(handleReconnect);
    };
  }, [addReconnectListener, removeReconnectListener, handleReconnect]);


  // 4. Mengambil data awal saat komponen pertama kali di-render
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Ekstrak nilai pengaturan dengan nilai default
  const monthlyTarget = settings['monthly_donation_target'] || '0';
  const yearlyTarget = settings['yearly_donation_target'] || '0';
  const activityThreshold = settings['user_activity_threshold_days'] || '90';

  if (loading) {
    return (
        <div className="text-center p-8">
            <p>Memuat pengaturan...</p>
        </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Atur Target Donasi</CardTitle>
          <CardDescription>
            Ubah nilai target donasi bulanan dan tahunan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TargetSettingsForm
            monthlyTarget={monthlyTarget}
            yearlyTarget={yearlyTarget}
          />
        </CardContent>
      </Card>
      
      {/* <Card>
        <CardHeader>
          <CardTitle>Manajemen Kategori Pengeluaran</CardTitle>
          <CardDescription>
            Tambah atau hapus kategori untuk form pengeluaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager initialCategories={categories} />
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Atur Status Keaktifan Pengguna</CardTitle>
          <CardDescription>
            Tentukan batas hari tanpa donasi sebelum pengguna dianggap "Tidak Aktif".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityThresholdForm defaultValue={activityThreshold} />
        </CardContent>
      </Card>
    </div>
  );
}
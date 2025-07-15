// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeStatus } from '@/context/realtime-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
// import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

// Tipe data untuk state
type KpiData = {
  operationalBalance: number;
  totalMonthlyIncome: number;
  totalIncome: number;
  totalMonthlyExpenses: number;
  totalExpenses: number;
  newUsersCount: number | null;
};

type RecentActivityData = {
  recentDonations: unknown[];
  recentExpenses: unknown[];
};

// Helper untuk format mata uang
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

// Komponen KPI Card (tanpa perubahan)
function KpiCard({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

// Komponen untuk menampilkan aktivitas terbaru (dibuat menjadi non-async)
function RecentActivity({ data }: { data: RecentActivityData }) {
    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>5 Donasi Terakhir</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {data.recentDonations?.map((d, i) => (
                            <li key={i} className="flex justify-between text-sm">
                                <span>{(d as { nama_donatur: string }).nama_donatur}</span>
                                <span className="font-medium">{formatCurrency((d as { jumlah: number }).jumlah)}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>5 Pengeluaran Terakhir</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="space-y-2">
                        {data.recentExpenses?.map((e, i) => (
                            <li key={i} className="flex justify-between text-sm">
                                <span>{(e as { deskripsi: string }).deskripsi}</span>
                                <span className="font-medium">{formatCurrency((e as { jumlah: number }).jumlah)}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

// Komponen loading skeleton
function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        </div>
    );
}


export default function AdminDashboardPage() {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [activityData, setActivityData] = useState<RecentActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

  const fetchData = useCallback(async () => {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);
    const sevenDaysAgo = subDays(today, 7);

    // Fetch semua data secara paralel
    const [
      monthlyDonationsRes,
      allDonationsRes,
      monthlyExpensesRes,
      allExpensesRes,
      newUsersRes,
      recentDonationsRes,
      recentExpensesRes
    ] = await Promise.all([
      supabase.from('donations').select('jumlah').gte('tanggal_donasi', format(firstDayOfMonth, 'yyyy-MM-dd')).lte('tanggal_donasi', format(lastDayOfMonth, 'yyyy-MM-dd')),
      supabase.from('donations').select('jumlah'),
      supabase.from('expenses').select('jumlah').gte('tanggal', format(firstDayOfMonth, 'yyyy-MM-dd')).lte('tanggal', format(lastDayOfMonth, 'yyyy-MM-dd')),
      supabase.from('expenses').select('jumlah'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', format(sevenDaysAgo, 'yyyy-MM-dd HH:mm:ss')),
      supabase.from('donations').select('nama_donatur, jumlah, tanggal_donasi').order('tanggal_donasi', { ascending: false }).limit(5),
      supabase.from('expenses').select('deskripsi, jumlah, tanggal').order('tanggal', { ascending: false }).limit(5)
    ]);

    // Proses data KPI
    const totalMonthlyIncome = monthlyDonationsRes.data?.reduce((sum, { jumlah }) => sum + jumlah, 0) || 0;
    const totalIncome = allDonationsRes.data?.reduce((sum, { jumlah }) => sum + jumlah, 0) || 0;
    const totalMonthlyExpenses = monthlyExpensesRes.data?.reduce((sum, { jumlah }) => sum + jumlah, 0) || 0;
    const totalExpenses = allExpensesRes.data?.reduce((sum, { jumlah }) => sum + jumlah, 0) || 0;
    const operationalBalance = totalIncome - totalExpenses;
    
    setKpiData({
      operationalBalance,
      totalMonthlyIncome,
      totalIncome,
      totalMonthlyExpenses,
      totalExpenses,
      newUsersCount: newUsersRes.count
    });

    // Proses data aktivitas terbaru
    setActivityData({
        recentDonations: recentDonationsRes.data || [],
        recentExpenses: recentExpensesRes.data || []
    });

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // useEffect untuk re-fetch data saat koneksi kembali
  useEffect(() => {
    const handleReconnect = () => {
        console.log("Koneksi pulih, memuat ulang data dashboard admin...");
        fetchData();
    };
    
    addReconnectListener(handleReconnect);

    return () => {
        removeReconnectListener(handleReconnect);
    };
  }, [fetchData, addReconnectListener, removeReconnectListener]);

  if (loading || !kpiData || !activityData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard 
                title="Saldo Operasional"
                value={formatCurrency(kpiData.operationalBalance)}
                icon={DollarSign}
                description="Total Pemasukan - Total Pengeluaran"
            />
            <KpiCard 
                title="Pemasukan (Bulan Ini)"
                value={formatCurrency(kpiData.totalMonthlyIncome)}
                icon={ArrowUpCircle}
                description={`Total: ${formatCurrency(kpiData.totalIncome)}`}
            />
            <KpiCard 
                title="Pengeluaran (Bulan Ini)"
                value={formatCurrency(kpiData.totalMonthlyExpenses)}
                icon={ArrowDownCircle}
                description={`Total: ${formatCurrency(kpiData.totalExpenses)}`}
            />
            <KpiCard 
                title="Pengguna Baru (7 Hari)"
                value={`+${kpiData.newUsersCount || 0}`}
                icon={Users}
                description="Jumlah pendaftar baru"
            />
        </div>
        
        <RecentActivity data={activityData} />
    </div>
  );
}
'use client'

import React, { useCallback } from 'react'; // Impor useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Heart, Repeat, ArrowUp, ArrowDown } from 'lucide-react';
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook status

// --- Tipe Data ---
type Donation = {
  jumlah: number;
  nama_donatur: string;
};

type TopDonor = {
  nama: string;
  value: number;
};

type PerformanceMetrics = {
  recurringDonors: number;
  avgDonationAmount: number;
  avgTotalPerDonor: number;
  topByFrequency: TopDonor[];
  topByAmount: TopDonor[];
};


export default function TopPerformersTab() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus(); // Gunakan hook

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  // --- FUNGSI PROSES DATA ---
  const performanceData = useMemo((): PerformanceMetrics | null => {
    if (donations.length === 0) return null;

    const donationsByDonor: { [key: string]: { total: number; count: number } } = {};
    donations.forEach(d => {
        if (!donationsByDonor[d.nama_donatur]) {
            donationsByDonor[d.nama_donatur] = { total: 0, count: 0 };
        }
        donationsByDonor[d.nama_donatur].total += d.jumlah;
        donationsByDonor[d.nama_donatur].count += 1;
    });

    const donorList = Object.entries(donationsByDonor).map(([nama, data]) => ({ nama, ...data }));
    const totalDonors = donorList.length;

    const recurringDonors = donorList.filter(d => d.count > 1).length;
    const avgDonationAmount = donations.reduce((sum, d) => sum + d.jumlah, 0) / donations.length;
    const avgTotalPerDonor = donorList.reduce((sum, d) => sum + d.total, 0) / totalDonors;

    const topByFrequency: TopDonor[] = [...donorList]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(d => ({ nama: d.nama, value: d.count }));

    const topByAmount: TopDonor[] = [...donorList]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(d => ({ nama: d.nama, value: d.total }));

    return {
      recurringDonors,
      avgDonationAmount,
      avgTotalPerDonor,
      topByFrequency,
      topByAmount
    };
  }, [donations]);

  // --- SIMULASI DATA PERIODE SEBELUMNYA ---
  const previousPerformanceData = useMemo((): Partial<PerformanceMetrics> => {
    if (!performanceData) return {};
    return {
        recurringDonors: Math.max(0, performanceData.recurringDonors - Math.round(Math.random() * 5) - 2),
        avgDonationAmount: performanceData.avgDonationAmount * (1 - (Math.random() * 0.1 - 0.05)), // +/- 5%
        avgTotalPerDonor: performanceData.avgTotalPerDonor * (1 - (Math.random() * 0.1 - 0.05)), // +/- 5%
    }
  }, [performanceData]);


  // --- AWAL PERUBAHAN UTAMA ---
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase.from('donations').select('jumlah, nama_donatur');
      if (error) throw new Error("Gagal mengambil data donasi.");
      setDonations(data as Donation[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('top-performers-reconnect').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchData).subscribe();
    
    addReconnectListener(fetchData);

    return () => { 
      supabase.removeChannel(channel); 
      removeReconnectListener(fetchData);
    };
  }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);
  // --- AKHIR PERUBAHAN UTAMA ---


  // --- KOMPONEN-KOMPONEN KECIL ---

  const DonorList = ({ title, data, isCurrency = false }: { title: string, data: TopDonor[], isCurrency?: boolean }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);

    return (
        <div>
            <h4 className="font-semibold text-sm mb-4">{title}</h4>
            <div className="space-y-4">
                {data.map((donor, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{donor.nama.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm font-medium truncate pr-2">{donor.nama}</p>
                                <p className="text-sm font-bold">
                                    {isCurrency ? formatCurrency(donor.value) : `${donor.value}x`}
                                </p>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{ width: `${(donor.value / maxValue) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const KpiCard = ({ title, value, icon, previousValue }: { title: string, value: string, icon: React.ReactNode, previousValue?: number }) => {
    const currentValue = parseFloat(value.replace(/[^0-9,-]+/g,""));
    const change = previousValue != null && previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
    const isPositive = change >= 0;

    return (
        <div className="flex items-center gap-4">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{value}</p>
                    {previousValue != null && (
                         <div className={`flex items-center text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {change.toFixed(1)}%
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-full p-8"><p>Memuat data performa...</p></div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!performanceData) return <div className="h-[400px] flex items-center justify-center text-muted-foreground"><p>Tidak ada data untuk ditampilkan.</p></div>;

  // --- RENDER UTAMA ---
  return (
    <Card>
        <CardHeader>
            <CardTitle>Aktivitas Donatur</CardTitle>
            <CardDescription>Ringkasan performa dan donatur paling aktif dengan tren perbandingan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Metrik Utama dengan Konteks */}
            <div className="grid gap-6 sm:grid-cols-3">
                <KpiCard
                    title="Donatur Berulang"
                    value={performanceData.recurringDonors.toString()}
                    icon={<Repeat className="h-8 w-8" />}
                    previousValue={previousPerformanceData.recurringDonors}
                />
                <KpiCard
                    title="Rata-rata Donasi"
                    value={formatCurrency(performanceData.avgDonationAmount)}
                    icon={<Heart className="h-8 w-8" />}
                    previousValue={previousPerformanceData.avgDonationAmount}
                />
                <KpiCard
                    title="Rata-rata per Donatur"
                    value={formatCurrency(performanceData.avgTotalPerDonor)}
                    icon={<Crown className="h-8 w-8" />}
                    previousValue={previousPerformanceData.avgTotalPerDonor}
                />
            </div>

            {/* Garis Pemisah Visual */}
            <Separator className="my-6" />

            {/* Daftar Top 5 dengan Grafik Batang */}
            <div className="grid gap-8 md:grid-cols-2">
                <DonorList title="Top 5 Donatur (Jumlah Donasi)" data={performanceData.topByFrequency} />
                <DonorList title="Top 5 Donatur (Total Nominal)" data={performanceData.topByAmount} isCurrency={true} />
            </div>
        </CardContent>
    </Card>
  )
}

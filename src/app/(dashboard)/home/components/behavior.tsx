'use client'

import React, { useCallback } from 'react'; // Impor useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook status

// Tipe data donasi yang dibutuhkan
type Donation = {
  jumlah: number;
  nama_donatur: string;
};

// Palet warna yang akan kita gunakan
const PRIMARY_CHART_COLOR = "#3b82f6"; // Biru

export default function BehaviorTab() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus(); // Gunakan hook

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  // --- FUNGSI PROSES DATA ---

  const frequencyData = useMemo(() => {
    if (donations.length === 0) return [];
    
    const donationsByDonor: { [key: string]: number[] } = {};
    donations.forEach(d => {
        if (!donationsByDonor[d.nama_donatur]) {
            donationsByDonor[d.nama_donatur] = [];
        }
        donationsByDonor[d.nama_donatur].push(d.jumlah);
    });

    const buckets: { [key: string]: { total: number; count: number } } = {
        'Satu Kali (1x)': { total: 0, count: 0 },
        'Jarang (2-4x)': { total: 0, count: 0 },
        'Sering (5x+)': { total: 0, count: 0 },
    };

    Object.values(donationsByDonor).forEach(donationsList => {
        const freq = donationsList.length;
        const sum = donationsList.reduce((a, b) => a + b, 0);
        if (freq === 1) {
            buckets['Satu Kali (1x)'].total += sum;
            buckets['Satu Kali (1x)'].count += freq;
        } else if (freq >= 2 && freq <= 4) {
            buckets['Jarang (2-4x)'].total += sum;
            buckets['Jarang (2-4x)'].count += freq;
        } else {
            buckets['Sering (5x+)'].total += sum;
            buckets['Sering (5x+)'].count += freq;
        }
    });

    return Object.entries(buckets).map(([name, data]) => ({
        name,
        'Rata-rata Donasi': data.count > 0 ? data.total / data.count : 0,
    }));
  }, [donations]);

  const distributionData = useMemo(() => {
    if (donations.length === 0) return [];

    const buckets = {
        '< Rp 50rb': 0,
        'Rp 50rb - 100rb': 0,
        'Rp 100rb - 500rb': 0,
        '> Rp 500rb': 0,
    };

    donations.forEach(d => {
        if (d.jumlah < 50000) buckets['< Rp 50rb']++;
        else if (d.jumlah <= 100000) buckets['Rp 50rb - 100rb']++;
        else if (d.jumlah <= 500000) buckets['Rp 100rb - 500rb']++;
        else buckets['> Rp 500rb']++;
    });

    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [donations]);

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

    const channel = supabase.channel('behavior-reconnect-final').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchData).subscribe();
    
    addReconnectListener(fetchData);

    return () => { 
      supabase.removeChannel(channel); 
      removeReconnectListener(fetchData);
    };
  }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);
  // --- AKHIR PERUBAHAN UTAMA ---


  if (loading) return <div className="flex items-center justify-center h-full p-8"><p>Memuat data perilaku...</p></div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
        {/* === CARD 1: Rata-rata Nominal per Frekuensi (DENGAN LABEL LANGSUNG) === */}
        <Card>
            <CardHeader>
                <CardTitle>Rata-rata Nominal per Frekuensi</CardTitle>
                <CardDescription>Perbandingan rata-rata nominal donasi berdasarkan frekuensi donatur.</CardDescription>
            </CardHeader>
            <CardContent>
                {frequencyData.length > 0 ? (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={frequencyData} layout="vertical" margin={{ right: 80 }}> {/* Beri margin kanan untuk label */}
                                <XAxis type="number" stroke="#888888" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} />
                                <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} width={100} />
                                <RechartsTooltip 
                                    formatter={(value) => formatCurrency(value as number)} 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                />
                                
                                <Bar dataKey="Rata-rata Donasi" fill={PRIMARY_CHART_COLOR} radius={[0, 4, 4, 0]}>
                                    <LabelList 
                                      dataKey="Rata-rata Donasi" 
                                      position="right" 
                                      offset={8}
                                      style={{ fill: '#888888' }} 
                                      formatter={(value: unknown) => formatCurrency(Number(value))}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                        <p>Tidak ada data untuk ditampilkan.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* === CARD 2: Distribusi Jumlah Donasi (DIGANTI MENJADI GRAFIK BATANG) === */}
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Jumlah Donasi</CardTitle>
                <CardDescription>Jumlah transaksi donasi berdasarkan rentang nominalnya.</CardDescription>
            </CardHeader>
            <CardContent>
                {distributionData.length > 0 ? (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={distributionData} layout="vertical" margin={{ right: 40 }}> {/* Beri margin kanan untuk label */}
                                <XAxis type="number" stroke="#888888" fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} width={110} />
                                <RechartsTooltip 
                                    formatter={(value) => `${value} transaksi`} 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                />
                                <Bar dataKey="value" fill={PRIMARY_CHART_COLOR} radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="value" position="right" offset={8} style={{ fill: '#888888' }} formatter={(value: unknown) => `${value}`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                        <p>Tidak ada data untuk ditampilkan.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  )
}

'use client'

import React, { useCallback } from 'react'; // Impor useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { DataKey } from 'recharts/types/util/types';
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook status

// Tipe data tidak berubah
type Donation = { tanggal_donasi: string; jumlah: number; };
type YearlyTrendData = { month: string; [year: string]: number | string; };
type HeatmapData = { day: string; [month: string]: number | string; };

// Palet warna yang akan kita gunakan
const CHART_COLORS = ["#3b82f6", "#16a34a", "#f97316", "#9333ea", "#e11d48"];

export default function TrendsAnalyticsTab() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'nominal' | 'frekuensi'>('nominal');
  const [visibility, setVisibility] = useState<{ [key: string]: boolean }>({});

  const [focusedYear, setFocusedYear] = useState<string | null>(null);
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus(); // Gunakan hook

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  // Memo-isasi data (tidak ada perubahan)
  const yearlyTrendData = useMemo(() => {
    if (donations.length === 0) return [];
    const yearlyData: { [year: string]: number[] } = {};
    const years = new Set<string>();
    donations.forEach(d => {
      const date = new Date(d.tanggal_donasi);
      const year = date.getFullYear().toString();
      const month = date.getMonth();
      years.add(year);
      if (!yearlyData[year]) { yearlyData[year] = Array(12).fill(0); }
      yearlyData[year][month] += d.jumlah;
    });
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return monthNames.map((monthName, index) => {
        const row: YearlyTrendData = { month: monthName };
        years.forEach(year => { row[year] = yearlyData[year]?.[index] || 0; });
        return row;
    });
  }, [donations]);

  const availableYears = useMemo(() => {
    if (donations.length === 0) return [];
    return [...new Set(donations.map(d => new Date(d.tanggal_donasi).getFullYear().toString()))].sort();
  }, [donations]);

  useEffect(() => {
    const initialVisibility: { [key: string]: boolean } = {};
    availableYears.forEach(year => {
        initialVisibility[year] = true;
    });
    setVisibility(initialVisibility);

    if (availableYears.length > 0) {
        setFocusedYear(availableYears[availableYears.length - 1]);
      }

  }, [availableYears]);

  const heatmapData = useMemo(() => {
    if (donations.length === 0) return [];
    const matrix = Array(7).fill(0).map(() => Array(12).fill(0));
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    donations.forEach(d => {
        const date = new Date(d.tanggal_donasi);
        const dayOfWeek = date.getDay(); const month = date.getMonth();
        if (heatmapMode === 'nominal') { matrix[dayOfWeek][month] += d.jumlah; }
        else { matrix[dayOfWeek][month] += 1; }
    });
    return dayNames.map((dayName, dayIndex) => {
        const row: HeatmapData = { day: dayName };
        monthNames.forEach((monthName, monthIndex) => { row[monthName] = matrix[dayIndex][monthIndex]; });
        return row;
    });
  }, [donations, heatmapMode]);

  const heatmapValues = useMemo(() => heatmapData.flatMap(row => Object.values(row).filter(v => typeof v === 'number')) as number[], [heatmapData]);
  const maxHeatmapValue = Math.max(...heatmapValues, 1);

  // --- AWAL PERUBAHAN UTAMA ---
  const fetchData = useCallback(async () => {
    // Tidak set loading di sini agar refresh mulus
    try {
      setError(null);
      const { data, error } = await supabase.from('donations').select('tanggal_donasi, jumlah');
      if (error) throw new Error("Gagal mengambil data donasi.");
      setDonations(data as Donation[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      // Hanya set loading false setelah fetch pertama kali
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData(); // Panggil saat komponen dimuat

    const channel = supabase
      .channel('trends-interactive-final-reconnect')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchData)
      .subscribe();
      
    // Daftarkan listener untuk re-koneksi
    addReconnectListener(fetchData);

    return () => { 
      supabase.removeChannel(channel);
      // Bersihkan listener saat komponen unmount
      removeReconnectListener(fetchData);
    };
  }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);
  // --- AKHIR PERUBAHAN UTAMA ---

  const handleLegendClick = (dataKey: DataKey<any>) => {
    if (typeof dataKey === 'string') {
      setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
      if (!visibility[dataKey]) {
        setFocusedYear(dataKey);
      } else if (focusedYear === dataKey) {
        setFocusedYear(null);
      }
    }
  };

  const getGradientColor = (value: number, maxValue: number): string => {
    if (value === 0) {
      return '#f3f4f6';
    }
    const startColor = { r: 191, g: 219, b: 254 };
    const endColor = { r: 59, g: 130, b: 246 };
    const ratio = Math.min(value / maxValue, 1);
    const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
    const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
    const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (loading) return <div className="flex items-center justify-center h-full p-8"><p>Memuat data analitik...</p></div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <TooltipProvider>
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Tren Donasi Tahunan</CardTitle>
                    <CardDescription>Perbandingan total donasi per bulan. Klik pada legenda untuk menampilkan/menyembunyikan tahun.</CardDescription>
                </CardHeader>
                <CardContent>
                    {yearlyTrendData.length > 0 ? (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer>
                                <LineChart data={yearlyTrendData}>
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} axisLine={false} tickLine={false} domain={[0, 'dataMax']}/>
                                    <RechartsTooltip
                                        formatter={(value) => formatCurrency(value as number)}
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            color: '#0f172a',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                        }}
                                    />
                                    <Legend onClick={(e) => e.dataKey && handleLegendClick(e.dataKey)} />
                                        {availableYears.map((year, index) => {
                                            const isFocused = year === focusedYear;
                                            const defaultColor = CHART_COLORS[index % CHART_COLORS.length];
                                            const strokeColor = isFocused ? defaultColor : '#6b7280';
                                            const strokeWidth = isFocused ? 2.5 : 1.5;

                                            return (
                                            <Line
                                                key={year}
                                                type="monotone"
                                                dataKey={year}
                                                stroke={strokeColor}
                                                strokeWidth={strokeWidth}
                                                strokeOpacity={visibility[year] ? 1 : 0}
                                            />
                                            );
                                        })}
                                        </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                            <p>Tidak ada data untuk ditampilkan.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle>Heatmap Aktivitas Donasi</CardTitle>
                            <CardDescription>Intensitas donasi berdasarkan bulan dan hari.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant={heatmapMode === 'nominal' ? 'default' : 'outline'} onClick={() => setHeatmapMode('nominal')}>Nominal</Button>
                            <Button size="sm" variant={heatmapMode === 'frekuensi' ? 'default' : 'outline'} onClick={() => setHeatmapMode('frekuensi')}>Frekuensi</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {donations.length > 0 ? (
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
                            <div />
                            <div className="grid grid-cols-12 gap-1 text-center font-semibold text-muted-foreground">
                                {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map(m => <div key={m}>{m}</div>)}
                            </div>
                            {heatmapData.map((row, dayIndex) => (
                                <React.Fragment key={dayIndex}>
                                    <div className="font-semibold text-right text-muted-foreground">{row.day}</div>
                                    <div className="grid grid-cols-12 gap-1">
                                        {Object.keys(row).filter(k => k !== 'day').map((month) => {
                                            const value = row[month] as number;
                                            const backgroundColor = getGradientColor(value, maxHeatmapValue);

                                            return (
                                            <Tooltip key={`${row.day}-${month}`} delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                <div
                                                    className="aspect-square w-full rounded-sm"
                                                    style={{ backgroundColor }} 
                                                />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                <p className="font-semibold">{heatmapMode === 'nominal' ? formatCurrency(value) : `${value} transaksi`}</p>
                                                <p className="text-xs text-muted-foreground">{`${row.day}, ${month}`}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            );
                                        })}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            <p>Tidak ada data untuk ditampilkan.</p>
                        </div>
                    )}
                    {donations.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Rendah</span>
                            <div
                                className="h-2 flex-1 rounded-full"
                                style={{
                                    background: 'linear-gradient(to right, rgb(191, 219, 254), rgb(59, 130, 246))',
                                }}
                            />
                            <div className="flex flex-col items-end">
                                <span className="text-muted-foreground">Tinggi</span>
                                <span className="font-semibold">
                                    {heatmapMode === 'nominal'
                                        ? formatCurrency(maxHeatmapValue)
                                        : maxHeatmapValue.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </TooltipProvider>
  )
}
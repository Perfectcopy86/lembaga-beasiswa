'use client'

import React, { useCallback } from 'react'; // Impor useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook status

// Tipe data
type Donation = {
  jumlah: number;
  nama_donatur: string;
  tanggal_donasi: string;
  user_id: string | null;
};
type Profile = {
  id: string;
  jenis_kelamin: string;
};
type QuarterlyData = {
  name: string;
  value: number;
  percentage: number;
  months: string;
};

// Definisikan palet warna yang lebih kohesif di atas komponen
const DASHBOARD_PALETTE = ["#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#facc15"];

// --- 1. DEFINISIKAN WARNA SPESIFIK UNTUK DEMOGRAFI ---
const GENDER_COLORS: { [key: string]: string } = {
    'Perempuan': DASHBOARD_PALETTE[3], // #ec4899
    'Laki-laki': DASHBOARD_PALETTE[0], // #3b82f6
    'Tidak Diketahui': '#a1a1aa'
  };


// Komponen untuk legenda kustom
const CustomLegend = ({ data }: { data: QuarterlyData[] }) => {
    return (
        <div className="space-y-2 text-sm text-muted-foreground">
            {data.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: DASHBOARD_PALETTE[index % DASHBOARD_PALETTE.length] }} />
                    <span className="flex-1">{`${entry.name} (${entry.months})`}</span>
                    <span className="font-semibold text-foreground">{`${entry.percentage.toFixed(1)}%`}</span>
                </div>
            ))}
        </div>
    );
};

export default function DistributionTab() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus(); // Gunakan hook

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const availableYears = useMemo(() => {
    if (donations.length === 0) return [];
    return ['all', ...Array.from(new Set(donations.map(d => new Date(d.tanggal_donasi).getFullYear().toString()))).sort((a,b) => Number(b) - Number(a))];
  }, [donations]);

  const quarterlyData = useMemo((): QuarterlyData[] => {
    if (donations.length === 0) return [];
    const filteredDonations = selectedYear === 'all'
        ? donations
        : donations.filter(d => new Date(d.tanggal_donasi).getFullYear().toString() === selectedYear);
    if (filteredDonations.length === 0) return [];
    const quarterlyTotals: { [key: string]: number } = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
    const totalAmount = filteredDonations.reduce((sum, d) => sum + d.jumlah, 0);
    filteredDonations.forEach(d => {
        const month = new Date(d.tanggal_donasi).getMonth();
        if (month < 3) quarterlyTotals['Q1'] += d.jumlah;
        else if (month < 6) quarterlyTotals['Q2'] += d.jumlah;
        else if (month < 9) quarterlyTotals['Q3'] += d.jumlah;
        else quarterlyTotals['Q4'] += d.jumlah;
    });
    const monthMap: { [key: string]: string } = { 'Q1': 'Jan-Mar', 'Q2': 'Apr-Jun', 'Q3': 'Jul-Sep', 'Q4': 'Okt-Des' };
    return Object.entries(quarterlyTotals)
        .map(([key, value]) => ({
            name: `Kuartal ${key.slice(1)}`,
            value,
            percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0,
            months: monthMap[key]
        }))
        .filter(d => d.value > 0);
  }, [donations, selectedYear]);

  const consistencyData = useMemo(() => {
    if (donations.length === 0) return [];
    const donationsByDonor: { [key: string]: number } = {};
    donations.forEach(d => { donationsByDonor[d.nama_donatur] = (donationsByDonor[d.nama_donatur] || 0) + 1; });
    const buckets = { 'Satu Kali (1x)': 0, 'Jarang (2-4x)': 0, 'Sering (5x+)': 0 };
    Object.values(donationsByDonor).forEach(freq => {
        if (freq === 1) buckets['Satu Kali (1x)']++;
        else if (freq >= 2 && freq <= 4) buckets['Jarang (2-4x)']++;
        else buckets['Sering (5x+)']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, 'Jumlah Donatur': value })).filter(item => item['Jumlah Donatur'] > 0);
  }, [donations]);

  const demographicsData = useMemo(() => {
    if (!profiles || profiles.length === 0 || !donations || donations.length === 0) {
      return [];
    }
    const donorIds = new Set(
      donations
        .map(d => d.user_id)
        .filter((id): id is string => id !== null)
    );
    if (donorIds.size === 0) {
      return [];
    }
    const donorProfiles = profiles.filter(p => donorIds.has(p.id));
    const genderCounts: { [key: string]: number } = {};
    donorProfiles.forEach(p => {
        const gender = p.jenis_kelamin || 'Tidak Diketahui';
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });
    return Object.entries(genderCounts).map(([name, value]) => ({ name, value }));
  }, [donations, profiles]);

  // --- AWAL PERUBAHAN UTAMA ---
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [donationRes, profileRes] = await Promise.all([
        supabase.from('donations').select('jumlah, nama_donatur, tanggal_donasi, user_id'),
        supabase.from('profiles').select('id, jenis_kelamin')
      ]);
      if (donationRes.error) throw new Error("Gagal mengambil data donasi.");
      if (profileRes.error) throw new Error("Gagal mengambil data profil.");
      setDonations(donationRes.data as Donation[]);
      setProfiles(profileRes.data as Profile[]);
    } catch (err: unknown) { 
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally { 
      setLoading(false); 
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();

    const donationChannel = supabase.channel('dist-donations-reconnect').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchData).subscribe();
    const profileChannel = supabase.channel('dist-profiles-reconnect').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe();
    
    addReconnectListener(fetchData);

    return () => { 
      supabase.removeChannel(donationChannel); 
      supabase.removeChannel(profileChannel); 
      removeReconnectListener(fetchData);
    };
  }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);
  // --- AKHIR PERUBAHAN UTAMA ---

  if (loading) return <div className="flex items-center justify-center h-full p-8"><p>Memuat data distribusi...</p></div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card: Proporsi per Kuartal */}
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Proporsi per Kuartal</CardTitle>
                        <CardDescription>Total donasi per kuartal.</CardDescription>
                    </div>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Pilih tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year}>
                                    {year === 'all' ? 'Semua Tahun' : year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {quarterlyData.length > 0 ? (
                    <div className="space-y-4">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={quarterlyData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                                        {quarterlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DASHBOARD_PALETTE[index % DASHBOARD_PALETTE.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <CustomLegend data={quarterlyData} />
                    </div>
                ) : <div className="h-[350px] flex items-center justify-center text-muted-foreground"><p>Tidak ada data.</p></div>}
            </CardContent>
        </Card>

        {/* Card: Konsistensi Donatur */}
        <Card>
            <CardHeader>
                <CardTitle>Konsistensi Donatur</CardTitle>
                <CardDescription>Jumlah donatur berdasarkan frekuensi donasi.</CardDescription>
            </CardHeader>
            <CardContent>
                {consistencyData.length > 0 ? (
                       <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={consistencyData} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" stroke="#888888" fontSize={12} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} width={80} />
                                    <RechartsTooltip formatter={(value) => `${value} donatur`} cursor={{ fill: 'hsl(var(--muted))' }} 
                                      contentStyle={{
                                        backgroundColor: '#ffffff',
                                        color: '#0f172a',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    }}/>
                                    <Bar dataKey="Jumlah Donatur" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                ) : <div className="h-[350px] flex items-center justify-center text-muted-foreground"><p>Tidak ada data.</p></div>}
            </CardContent>
        </Card>
        
        {/* Card: Demografi Donatur */}
        <Card>
            <CardHeader>
                <CardTitle>Demografi Donatur</CardTitle>
                <CardDescription>Distribusi donatur berdasarkan jenis kelamin.</CardDescription>
            </CardHeader>
            <CardContent>
                {demographicsData && demographicsData.length > 0 ? (
                    <div className="h-[350px] w-full">
                        {(() => {
                            const totalDonors = demographicsData.reduce((sum, entry) => sum + entry.value, 0);

                            const renderLegendWithPercent = (name: string, entry: unknown) => {
                                const { value } = (entry as { payload: { value: number } }).payload;
                                const percentage = totalDonors > 0 ? (value / totalDonors) * 100 : 0;
                                return `${name} (${percentage.toFixed(0)}%)`;
                            };

                            return (
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie 
                                            data={demographicsData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={100} 
                                            labelLine={false}
                                        >
                                            {demographicsData.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={GENDER_COLORS[entry.name]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => `${value} orang`} />
                                        <Legend formatter={renderLegendWithPercent} />
                                    </PieChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>
                ) : <div className="h-[350px] flex items-center justify-center text-muted-foreground"><p>Tidak ada data.</p></div>}
            </CardContent>
        </Card>
    </div>
  )
}

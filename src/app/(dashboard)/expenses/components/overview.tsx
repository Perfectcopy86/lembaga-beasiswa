'use client'

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Banknote, Wallet, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis } from "recharts";
import { useRealtimeStatus } from '@/context/realtime-context'; // Impor hook status

type Expense = { jumlah: number; tanggal: string; kategori: string; penerima: string; };
type Donation = { jumlah: number; };

const CHART_COLORS = ["#3b82f6", "#ef4444", "#16a34a", "#f97316"];

export default function OverviewTab() {
    const supabase = createClient();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const { addReconnectListener, removeReconnectListener } = useRealtimeStatus(); // Gunakan hook

    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    // --- AWAL PERUBAHAN UTAMA ---
    const fetchData = useCallback(async () => {
        // Tidak perlu setLoading(true) di sini agar update realtime lebih mulus
        const [expenseRes, donationRes] = await Promise.all([
            supabase.from('expenses').select('jumlah, tanggal, kategori, penerima'),
            supabase.from('donations').select('jumlah')
        ]);
        setExpenses(expenseRes.data as Expense[] || []);
        setDonations(donationRes.data as Donation[] || []);
        setLoading(false); // Hanya set loading false setelah fetch pertama kali
    }, [supabase]);
    
    useEffect(() => {
        fetchData();

        const channel = supabase
          .channel('expenses-overview-realtime-reconnect')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'expenses' },
            fetchData
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'donations' },
            fetchData
          )
          .subscribe();

        addReconnectListener(fetchData);

        return () => {
          supabase.removeChannel(channel);
          removeReconnectListener(fetchData);
        };
    }, [supabase, fetchData, addReconnectListener, removeReconnectListener]);
    // --- AKHIR PERUBAHAN UTAMA ---

    const kpiData = useMemo(() => {
        const totalPengeluaran = expenses.reduce((sum, e) => sum + e.jumlah, 0);
        const totalPemasukan = donations.reduce((sum, d) => sum + d.jumlah, 0);
        const sisaSaldo = totalPemasukan - totalPengeluaran;
        const uniqueMonths = new Set(expenses.map(e => new Date(e.tanggal).toISOString().slice(0, 7))).size;
        const rataRataPengeluaran = uniqueMonths > 0 ? totalPengeluaran / uniqueMonths : 0;
        const jumlahPenerima = new Set(expenses.map(e => e.penerima)).size;
        return { totalPengeluaran, sisaSaldo, rataRataPengeluaran, jumlahPenerima };
    }, [expenses, donations]);

    const compositionData = useMemo(() => {
        const byCategory: { [key: string]: number } = {};
        expenses.forEach(e => {
            const category = e.kategori || 'Lainnya';
            byCategory[category] = (byCategory[category] || 0) + e.jumlah;
        });
        return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    }, [expenses]);
    
    const trendData = useMemo(() => {
        const byMonthYear: { [key: string]: { [year: string]: number } } = {};
        const years = new Set<string>();

        expenses.forEach(e => {
            const date = new Date(e.tanggal);
            const year = date.getFullYear().toString();
            // const month = date.getMonth();
            years.add(year);
            const monthKey = date.toLocaleString('id-ID', { month: 'short' });

            if (!byMonthYear[monthKey]) byMonthYear[monthKey] = {};
            byMonthYear[monthKey][year] = (byMonthYear[monthKey][year] || 0) + e.jumlah;
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        return monthNames.map(month => {
            const entry: { [key: string]: unknown } = { month };
            years.forEach(year => {
                entry[year] = byMonthYear[month]?.[year] || null;
            });
            return entry;
        });
    }, [expenses]);

    const availableYears = useMemo(() => Array.from(new Set(expenses.map(e => new Date(e.tanggal).getFullYear().toString()))).sort(), [expenses]);

    if (loading) return <div className="text-center p-8">Memuat data overview...</div>;

    return (
        <div className="space-y-4">
            {/* Baris Pertama: Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(kpiData.totalPengeluaran)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sisa Saldo Donasi</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(kpiData.sisaSaldo)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Rata-rata Pengeluaran/Bulan</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(kpiData.rataRataPengeluaran)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Jumlah Penerima Manfaat</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpiData.jumlahPenerima}</div></CardContent></Card>
            </div>
            {/* Baris Kedua: Komposisi & Tren */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Komposisi Pengeluaran</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Visualisasi proporsi pengeluaran berdasarkan kategori.
                        </p>
                    </CardHeader>
                    <CardContent className="pl-2 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={compositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                                    {compositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Tren Pengeluaran Bulanan</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Garis yang terputus menandakan periode tersebut belum memiliki data pengeluaran.
                    </p>
                    </CardHeader>
                    
                    <CardContent className="pl-2 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                               
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                                <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} />
                                <RechartsTooltip formatter={(value) => formatCurrency(value as number)}
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                }}
                                />
                                <Legend />
                                {availableYears.map((year, index) => (
                                    <Line key={year} type="monotone" dataKey={year} stroke={CHART_COLORS[index % CHART_COLORS.length]} connectNulls />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

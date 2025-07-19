'use client'

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from "recharts";
import { useRealtimeStatus } from '@/context/realtime-context';

// Tipe data yang seragam untuk pemasukan dan pengeluaran
type DataPoint = {
  tanggal: string;
  jumlah: number;
};

export default function AnalyticsTab() {
    const supabase = createClient();
    const [expenses, setExpenses] = useState<DataPoint[]>([]);
    const [donations, setDonations] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<'6m' | 'ytd' | '1y' | 'all'>('all');
    const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    
    // --- AWAL PERUBAHAN UTAMA ---
    const fetchData = useCallback(async () => {
        // Tidak set loading di sini agar refresh mulus
        const [expenseRes, donationRes] = await Promise.all([
            supabase.from('expenses').select('tanggal, jumlah'),
            supabase.from('donations').select('tanggal_donasi, jumlah')
        ]);
    
        setExpenses(expenseRes.data as DataPoint[] || []);
        const formattedDonations = (donationRes.data || []).map(d => ({
            tanggal: d.tanggal_donasi,
            jumlah: d.jumlah
        }));
        setDonations(formattedDonations as DataPoint[]);
        setLoading(false); // Hanya set loading false setelah fetch pertama kali
    }, [supabase]);

    useEffect(() => {
        fetchData();
    
        const channel = supabase
          .channel('analytics-realtime-reconnect')
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

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = new Date(0);

        if (dateFilter === '6m') {
            startDate = new Date(new Date().setMonth(now.getMonth() - 6));
        } else if (dateFilter === 'ytd') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (dateFilter === '1y') {
            startDate = new Date(new Date().setFullYear(now.getFullYear() - 1));
        }

        const filterByDate = (data: DataPoint[]) => data.filter(item => new Date(item.tanggal) >= startDate);

        return {
            filteredDonations: filterByDate(donations),
            filteredExpenses: filterByDate(expenses),
        };

    }, [donations, expenses, dateFilter]);


    const comboChartData = useMemo(() => {
        const { filteredDonations, filteredExpenses } = filteredData;
        const allData: { [key: string]: { pemasukan: number, pengeluaran: number } } = {};

        filteredDonations.forEach(d => {
            const monthKey = new Date(d.tanggal).toISOString().slice(0, 7);
            if (!allData[monthKey]) allData[monthKey] = { pemasukan: 0, pengeluaran: 0 };
            allData[monthKey].pemasukan += d.jumlah;
        });

        filteredExpenses.forEach(e => {
            const monthKey = new Date(e.tanggal).toISOString().slice(0, 7);
            if (!allData[monthKey]) allData[monthKey] = { pemasukan: 0, pengeluaran: 0 };
            allData[monthKey].pengeluaran += e.jumlah;
        });
        
        let startingBalance = 0;
        const firstMonthKey = Object.keys(allData).sort()[0];
        if (firstMonthKey) {
            const filterStartDate = new Date(firstMonthKey + '-01');
        
            donations.forEach(d => {
                if (new Date(d.tanggal) < filterStartDate) startingBalance += d.jumlah;
            });
            expenses.forEach(e => {
                if (new Date(e.tanggal) < filterStartDate) startingBalance -= e.jumlah;
            });
        }


        let runningSaldo = startingBalance;
        return Object.keys(allData).sort().map(monthKey => {
            const { pemasukan, pengeluaran } = allData[monthKey];
            runningSaldo += pemasukan - pengeluaran;
            return {
                name: new Date(monthKey + '-02').toLocaleString('id-ID', { month: 'short', year: '2-digit' }),
                Pemasukan: pemasukan,
                Pengeluaran: pengeluaran,
                Saldo: runningSaldo
            };
        });
    }, [filteredData, donations, expenses]);

    const kpiData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthIncome = donations
            .filter(d => {
                const date = new Date(d.tanggal);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + item.jumlah, 0);

        const thisMonthExpense = expenses
            .filter(e => {
                const date = new Date(e.tanggal);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + item.jumlah, 0);
        
        const totalIncome = donations.reduce((sum, item) => sum + item.jumlah, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.jumlah, 0);
        const currentBalance = totalIncome - totalExpense;

        return {
            currentBalance,
            thisMonthIncome,
            thisMonthExpense,
        }
    }, [donations, expenses]);
    
    if (loading) return <div className="text-center p-8">Memuat data analitik...</div>;

    const commonTooltipProps = {
        formatter: (value: number) => formatCurrency(value),
        contentStyle: {
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }
    };

    const commonAxisProps = {
        stroke: "#9ca3af",
        fontSize: 12,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard Analitik</h2>
                    <p className="text-muted-foreground">
                        Pilih rentang waktu untuk melihat ringkasan data.
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <Button variant={dateFilter === '6m' ? 'default' : 'outline'} onClick={() => setDateFilter('6m')} className="cursor-pointer">6 Bulan</Button>
                    <Button variant={dateFilter === 'ytd' ? 'default' : 'outline'} onClick={() => setDateFilter('ytd')}className="cursor-pointer">Tahun Ini</Button>
                    <Button variant={dateFilter === '1y' ? 'default' : 'outline'} onClick={() => setDateFilter('1y')}className="cursor-pointer">1 Tahun</Button>
                    <Button variant={dateFilter === 'all' ? 'default' : 'outline'} onClick={() => setDateFilter('all')}className="cursor-pointer">Semua</Button>
                </div>
            </div>
    
            {comboChartData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between">
                            <div>
                                <CardTitle>Tinjauan Keuangan Bulanan</CardTitle>
                                <CardDescription>Arus kas (pemasukan vs pengeluaran) dan tren saldo berjalan.</CardDescription>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mt-4 md:mt-0 text-center md:text-right">
                                <div className="md:col-span-1">
                                    <p className="text-xs text-muted-foreground">Pemasukan Bulan Ini</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(kpiData.thisMonthIncome)}</p>
                                </div>
                                <div className="md:col-span-1">
                                    <p className="text-xs text-muted-foreground">Pengeluaran Bulan Ini</p>
                                    <p className="text-lg font-bold text-red-600">{formatCurrency(kpiData.thisMonthExpense)}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-xs text-muted-foreground">Saldo Terkini</p>
                                    <p className="text-xl font-bold">{formatCurrency(kpiData.currentBalance)}</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[450px] w-full pl-2 pt-6">
                    <ResponsiveContainer>
                        <ComposedChart data={comboChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="name" 
                                {...commonAxisProps} 
                                tickLine={false}
                            />
                            <YAxis 
                                {...commonAxisProps} 
                                tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip {...commonTooltipProps}/>
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Bar dataKey="Pemasukan" fill="#22c55e" barSize={20} />
                            <Bar dataKey="Pengeluaran" fill="#ef4444" barSize={20} />

                            <Line 
                                type="monotone" 
                                dataKey="Saldo" 
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
            ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-white rounded-lg border">
                    <p>Tidak ada data untuk ditampilkan pada rentang waktu ini.</p>
                </div>
            )}
        </div>
    );
}

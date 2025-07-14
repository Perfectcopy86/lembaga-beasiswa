// src/app/(dashboard)/profile/components/donation-history-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

type Donation = {
  tanggal_donasi: string;
  jumlah: number;
};

interface DonationHistoryChartProps {
  donations: Donation[];
}

// Helper untuk format mata uang di sumbu Y
const formatCurrencyAxis = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} Jt`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)} Rb`;
    return `Rp ${value}`;
}

// Helper untuk format mata uang di Tooltip
const formatCurrencyTooltip = (value: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export default function DonationHistoryChart({ donations }: DonationHistoryChartProps) {
  const chartData = useMemo(() => {
    if (!donations || donations.length === 0) {
      return [];
    }

    // Ubah data donasi menjadi titik-titik individual untuk grafik
    return donations
      .map(donation => ({
        // Simpan tanggal sebagai objek Date untuk perbandingan
        dateObj: parseISO(donation.tanggal_donasi), 
        // Format tanggal untuk ditampilkan di sumbu X
        date: format(parseISO(donation.tanggal_donasi), 'd MMM', { locale: id }),
        // Jumlah donasi
        amount: donation.jumlah,
      }))
      // Urutkan berdasarkan tanggal dari yang paling lama ke yang terbaru
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  }, [donations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Donasi Anda</CardTitle>
        <CardDescription>Grafik riwayat donasi Anda dari waktu ke waktu.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickFormatter={formatCurrencyAxis} 
                domain={[0, 'dataMax + 100000']} // Beri sedikit ruang di atas
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', // Latar belakang putih solid
                    color: '#0f172a', // Teks gelap (slate-900)
                    border: '1px solid #e2e8f0', // Border abu-abu terang (slate-200)
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',}}
                labelFormatter={(label) => `Tanggal: ${label}`}
                formatter={(value: number) => [formatCurrencyTooltip(value), "Jumlah"]}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4 }} // Tampilkan titik di setiap data
                activeDot={{ r: 8 }} // Titik yang lebih besar saat di-hover
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-center text-muted-foreground">
            {chartData.length === 1 
              ? "Butuh setidaknya dua donasi untuk menampilkan grafik tren."
              : "Belum ada data donasi untuk ditampilkan."
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}

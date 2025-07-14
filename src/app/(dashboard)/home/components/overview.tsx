'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, CreditCard, ArrowUpCircle, ArrowDownCircle, Info } from "lucide-react";
import { useEffect, useState, useCallback } from "react"; // 1. Impor useCallback
import { createClient } from "@/lib/supabase/client";
import { useRealtimeStatus } from "@/context/realtime-context"; // 2. Impor hook
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import { TooltipProps } from 'recharts';

// Tipe-tipe data Anda tetap sama
type Donation = {
  id: number;
  tanggal_donasi: string;
  jumlah: number;
  nama_donatur: string;
};
type ChartData = { name: string; total: number; };
type DonationTargets = { tahun_ini: number; bulan_ini: number; };
type AppSetting = { setting_key: string; setting_value: string; };

export default function OverviewTab() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [targets, setTargets] = useState<DonationTargets>({ bulan_ini: 5000000, tahun_ini: 50000000 });
  const [lineChartFilter, setLineChartFilter] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [gaugeChartFilter, setGaugeChartFilter] = useState<'this_month' | 'this_year'>('this_month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Gunakan hook untuk mendapatkan fungsi listener
  const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

  // Semua fungsi helper Anda (formatCurrency, getKpiData, dll.) tidak berubah
  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  const formatCurrencyCompact = (value: number) => new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  const getWeekOfMonth = (date: Date) => { const start = new Date(date.getFullYear(), date.getMonth(), 1); return Math.ceil((date.getDate() + start.getDay()) / 7); };
  const getKpiData = (data: Donation[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const thisMonthData = data.filter(d => { const date = new Date(d.tanggal_donasi); return date.getMonth() === currentMonth && date.getFullYear() === currentYear; });
    const lastMonthData = data.filter(d => { const date = new Date(d.tanggal_donasi); return date.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && date.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear); });
    const totalDonasiAllTime = data.reduce((sum, d) => sum + d.jumlah, 0);
    const donasiBulanan = thisMonthData.reduce((sum, d) => sum + d.jumlah, 0);
    const transaksiBulanan = thisMonthData.length;
    const totalDonaturAllTime = new Set(data.map(d => d.nama_donatur)).size;
    const donasiTahunan = data.filter(d => new Date(d.tanggal_donasi).getFullYear() === currentYear).reduce((sum, d) => sum + d.jumlah, 0);
    const donasiBulanLalu = lastMonthData.reduce((sum, d) => sum + d.jumlah, 0);
    const transaksiBulanLalu = lastMonthData.length;
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    const changeDonasiBulanan = calculateChange(donasiBulanan, donasiBulanLalu);
    const changeTransaksiBulanan = calculateChange(transaksiBulanan, transaksiBulanLalu);
    const donaturBulanIniSet = new Set(thisMonthData.map(d => d.nama_donatur));
    const donaturSebelumBulanIniSet = new Set(data.filter(d => new Date(d.tanggal_donasi) < startOfThisMonth).map(d => d.nama_donatur));
    const donaturBaruBulanIni = [...donaturBulanIniSet].filter(donatur => !donaturSebelumBulanIniSet.has(donatur)).length;
    const basisDonaturLalu = donaturSebelumBulanIniSet.size;
    const changeDonaturGrowth = basisDonaturLalu > 0 ? (donaturBaruBulanIni / basisDonaturLalu) * 100 : donaturBaruBulanIni > 0 ? 100 : 0;
    return { 
        totalDonasiAllTime, donasiBulanan, donasiTahunan, transaksiBulanan,
        totalDonaturAllTime, donaturBaruBulanIni,
        changeDonasiBulanan, changeTransaksiBulanan, changeDonaturGrowth
    };
  };
  const getLineChartData = (data: Donation[], filter: 'monthly' | 'weekly' | 'yearly'): ChartData[] => {
    const now = new Date();
    if (filter === 'yearly') {
        const years = [...new Set(data.map(d => new Date(d.tanggal_donasi).getFullYear()))].sort();
        const yearData: { [key: number]: number } = {};
        data.forEach(d => { const year = new Date(d.tanggal_donasi).getFullYear(); yearData[year] = (yearData[year] || 0) + d.jumlah; });
        return years.map(year => ({ name: year.toString(), total: yearData[year] || 0 }));
    } else if (filter === 'monthly') {
        const currentYear = now.getFullYear();
        const monthData: { [key: number]: number } = {};
        data.forEach(d => { const date = new Date(d.tanggal_donasi); if (date.getFullYear() === currentYear) { monthData[date.getMonth()] = (monthData[date.getMonth()] || 0) + d.jumlah; }});
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        return monthNames.map((name, index) => ({ name, total: monthData[index] || 0 }));
    } else {
        const currentMonth = now.getMonth(); const currentYear = now.getFullYear(); const weekData: { [key: number]: number } = {};
        data.forEach(d => { const date = new Date(d.tanggal_donasi); if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) { const week = getWeekOfMonth(date); weekData[week] = (weekData[week] || 0) + d.jumlah; }});
        return Array.from({ length: 5 }, (_, i) => i + 1).map(week => ({ name: `Minggu ${week}`, total: weekData[week] || 0 }));
    }
  };
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string> & { payload?: Array<{ value: number }>, label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background border rounded-md shadow-md">
          <p className="font-bold">{`${label}`}</p>
          <p className="text-sm">{`Total Donasi: ${formatCurrency(payload[0].value as number)}`}</p>
        </div>
      );
    }
    return null;
  };
  const fetchTargetsFromAppSettings = async () => {
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['monthly_donation_target', 'yearly_donation_target']);

      if (settingsError) throw new Error("Gagal mengambil data target dari app_settings.");
      let monthlyTarget = 5000000; 
      let yearlyTarget = 50000000;
      if (settingsData && settingsData.length > 0) {
        settingsData.forEach((setting: AppSetting) => {
          if (setting.setting_key === 'monthly_donation_target') {
            monthlyTarget = parseInt(setting.setting_value) || 5000000;
          } else if (setting.setting_key === 'yearly_donation_target') {
            yearlyTarget = parseInt(setting.setting_value) || 50000000;
          }
        });
      }
      setTargets({ bulan_ini: monthlyTarget, tahun_ini: yearlyTarget });
  };
  
  // 4. Bungkus fungsi fetchData dengan useCallback
  const fetchData = useCallback(async () => {
    try {
      // Tidak set loading di sini agar refresh lebih mulus
      setError(null);
      
      // Ambil data donasi TANPA FILTER STATUS
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('id, tanggal_donasi, jumlah, nama_donatur');
      
      if (donationsError) {
        // Lemparkan error agar bisa ditangkap oleh catch block
        throw new Error("Gagal mengambil data donasi.");
      }
      setDonations(donationsData as Donation[]);
      
      // Ambil target dari app_settings
      await fetchTargetsFromAppSettings();
      
    } catch (err: any) { 
      setError(err.message); 
      console.error(err); // Tampilkan error di console untuk debug
    } finally { 
      setLoading(false); 
    }
  }, [supabase]); // <-- Cukup supabase sebagai dependency


  // 5. Gabungkan semua listener ke dalam satu useEffect
  useEffect(() => {
    // Panggil fetch data pertama kali
    fetchData();
    
    // Fungsi yang akan dipanggil saat ada perubahan atau reconnect
    const handleDataChange = () => {
        console.log("Change detected or reconnected, refetching overview data.");
        fetchData();
    };

    // Setup realtime subscriptions
    const channel = supabase
      .channel('realtime-kpi-final-fix-9') // Gunakan channel name yang unik
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, handleDataChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, handleDataChange)
      .subscribe();
    
    // Daftarkan listener untuk event reconnect
    addReconnectListener(handleDataChange);
    
    // Fungsi cleanup
    return () => { 
      supabase.removeChannel(channel); 
      removeReconnectListener(handleDataChange);
    };
  }, [fetchData, supabase, addReconnectListener, removeReconnectListener]); // <-- sesuaikan dependency
  
  // Sisa dari kode Anda (ChangeIndicator, JSX, dll) tidak perlu diubah
  const ChangeIndicator = ({ value, periodText }: { value: number, periodText: string }) => (
    <p className={`text-xs flex items-center gap-1 ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {value >= 0 ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
        {value.toFixed(1)}% {periodText}
    </p>
  );

  if (loading) return <div className="flex items-center justify-center h-full"><p>Memuat data...</p></div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  const kpiData = getKpiData(donations);
  const lineData = getLineChartData(donations, lineChartFilter);
  const currentGaugeTotal = gaugeChartFilter === 'this_month' ? kpiData.donasiBulanan : kpiData.donasiTahunan;
  const currentGaugeTarget = gaugeChartFilter === 'this_month' ? targets.bulan_ini : targets.tahun_ini;
  const gaugePercentage = currentGaugeTarget > 0 ? Math.round((currentGaugeTotal / currentGaugeTarget) * 100) : 0;
  const gaugeDataForChart = [{ name: 'progress', value: Math.min(gaugePercentage, 100), fill: gaugePercentage >= 100 ? '#22c55e' : '#3b82f6' }];
  const idealProgress = (new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100;

  return (
    <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Donasi</CardTitle>
                    <span className="h-4 w-4 text-muted-foreground font-bold">Rp</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpiData.totalDonasiAllTime)}</div>
                    <ChangeIndicator value={kpiData.changeDonasiBulanan} periodText="dari bulan lalu" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Donasi Bulan Ini</CardTitle>
                    <span className="h-4 w-4 text-muted-foreground font-bold">Rp</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpiData.donasiBulanan)}</div>
                    <ChangeIndicator value={kpiData.changeDonasiBulanan} periodText="dari bulan lalu" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.transaksiBulanan}</div>
                      {kpiData.transaksiBulanan > 0 ? (
                          <ChangeIndicator value={kpiData.changeTransaksiBulanan} periodText="dari bulan lalu" />
                      ) : (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Info className="h-4 w-4" />
                              Tidak ada transaksi bulan ini
                          </p>
                      )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Donatur</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.totalDonaturAllTime}</div>
                  {kpiData.donaturBaruBulanIni > 0 ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                          <ArrowUpCircle className="h-4 w-4" />
                          +{kpiData.donaturBaruBulanIni} donatur baru bulan ini
                      </p>
                  ) : (
                      <p className="text-xs text-muted-foreground">
                          Tidak ada tambahan donatur baru
                      </p>
                  )}
              </CardContent>
            </Card>
        </div>
        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Statistik Donasi</CardTitle>
                    <p className="text-sm text-muted-foreground">Visualisasi tren total donasi berdasarkan periode. </p>
                    <div className="flex items-center gap-2">
                        <Button variant={lineChartFilter === 'yearly' ? 'default' : 'outline'} size="sm" onClick={() => setLineChartFilter('yearly')}>Tahunan</Button>
                        <Button variant={lineChartFilter === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setLineChartFilter('monthly')}>Bulanan</Button>
                        <Button variant={lineChartFilter === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => setLineChartFilter('weekly')}>Mingguan</Button>
                    </div>
                </CardHeader>
                <CardContent className="pl-2 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lineData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrencyCompact(value as number)} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="total" name="Total Donasi" stroke="#3b82f6" fill="url(#colorTotal)" activeDot={{ r: 8 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Progres Donasi</CardTitle>
                    <p className="text-sm text-muted-foreground">Pencapaian donasi terhadap target periode.</p>
                     <div className="flex items-center gap-2">
                         <Button variant={gaugeChartFilter === 'this_year' ? 'default' : 'outline'} size="sm" onClick={() => setGaugeChartFilter('this_year')}>Tahun Ini</Button>
                         <Button variant={gaugeChartFilter === 'this_month' ? 'default' : 'outline'} size="sm" onClick={() => setGaugeChartFilter('this_month')}>Bulan Ini</Button>
                     </div>
                </CardHeader>
                <CardContent className="h-[350px] flex flex-col items-center justify-center">
                     <ResponsiveContainer width="100%" height="60%">
                         <RadialBarChart innerRadius="85%" outerRadius="100%" data={gaugeDataForChart} startAngle={180} endAngle={0}>
                             <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false}/>
                             <RadialBar background dataKey="value" cornerRadius={10} />
                               <text x="50%" y="80%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-foreground">
                                   {`${gaugePercentage}%`}
                               </text>
                         </RadialBarChart>
                     </ResponsiveContainer>
                     <div className="text-center -mt-8">
                         <p className="text-xs text-muted-foreground">Terkumpul</p>
                         <p className="text-lg font-semibold">{formatCurrency(currentGaugeTotal)}</p>
                         <p className="text-xs text-muted-foreground mt-1">dari Target {formatCurrency(currentGaugeTarget)}</p>
                         <p className={`text-xs mt-2 ${gaugePercentage < idealProgress ? 'text-red-500' : 'text-green-500'}`}>
                            {gaugePercentage < idealProgress ? 'Perlu dikejar' : 'Sesuai jalur'} (Target ideal saat ini: {idealProgress.toFixed(0)}%)
                        </p>
                     </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
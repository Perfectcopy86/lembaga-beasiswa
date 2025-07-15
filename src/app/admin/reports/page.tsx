// src/app/admin/reports/page.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Download, FileText, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// IMPOR FUNGSI YANG DIPERLUKAN
import { getReportData, exportDonationsToCsv, exportExpensesToCsv, getRawDataForPdf } from './actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// DEFINISIKAN TIPE DATA UNTUK DONASI
type DonationData = {
  tanggal_donasi: string;
  nama_donatur: string;
  jumlah: number;
  keterangan: string | null;
};

type ReportData = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  donationCount: number;
  expenseCount: number;
};

// Fungsi untuk mengubah gambar menjadi Base64
const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
          } else {
              reject(new Error('Gagal membuat canvas context.'));
          }
      };
      img.onerror = reject;
      img.src = url;
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(value);

// Fungsi untuk mendapatkan daftar bulan
const getMonthOptions = () => {
  const months = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear - 2; year <= currentYear; year++) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      months.push({
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: format(date, 'MMMM yyyy', { locale: id })
      });
    }
  }
  
  return months.reverse(); // Tampilkan yang terbaru dulu
};

export default function AdminReportsPage() {
  // State untuk CSV Export (menggunakan date range)
  const [csvDateRange, setCsvDateRange] = useState<DateRange | undefined>();
  const [csvReportData, setCsvReportData] = useState<ReportData | null>(null);
  const [isCsvGenerating, startCsvGenerating] = useTransition();
  const [isCsvExporting, startCsvExporting] = useTransition();

  // State untuk PDF Export (menggunakan month selection)
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [pdfReportData, setPdfReportData] = useState<ReportData | null>(null);
  const [isPdfGenerating, startPdfGenerating] = useTransition();
  const [isPdfExporting, startPdfExporting] = useTransition();

  const monthOptions = getMonthOptions();

  // Handler untuk CSV Report
  const handleGenerateCsvReport = () => {
    if (!csvDateRange?.from || !csvDateRange?.to) {
      alert('Silakan pilih rentang tanggal terlebih dahulu.');
      return;
    }
    startCsvGenerating(async () => {
      const data = await getReportData({ from: csvDateRange.from!, to: csvDateRange.to! });
      setCsvReportData(data);
    });
  };

  // Handler untuk PDF Report
  const handleGeneratePdfReport = () => {
    if (!selectedMonth) {
      alert('Silakan pilih bulan terlebih dahulu.');
      return;
    }
    
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
    
    startPdfGenerating(async () => {
      const data = await getReportData({ from: startDate, to: endDate });
      setPdfReportData(data);
    });
  };

  // Handler untuk CSV Export
  const handleCsvExport = (type: 'donations' | 'expenses') => {
    if (!csvDateRange?.from || !csvDateRange?.to) {
      alert('Silakan pilih rentang tanggal laporan yang ingin diekspor.');
      return;
    }
    startCsvExporting(async () => {
        const action = type === 'donations' ? exportDonationsToCsv : exportExpensesToCsv;
        const csvString = await action({ from: csvDateRange.from!, to: csvDateRange.to! });
        
        // Buat file dan unduh di client
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const fileName = `${type}_report_${format(csvDateRange.from!, 'yyyy-MM-dd')}_to_${format(csvDateRange.to!, 'yyyy-MM-dd')}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  // Handler untuk PDF Export
  const handlePdfExport = () => {
    if (!selectedMonth || !pdfReportData) {
        alert('Silakan buat laporan PDF terlebih dahulu sebelum mengekspor.');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    startPdfExporting(async () => {
      try {
        const { donations } = await getRawDataForPdf({ from: startDate, to: endDate });
        
        // Ambil logo dan ubah ke Base64
        const logoBase64 = await getBase64Image('/logo-ika-upi-pdf.png');

        const doc = new jsPDF();
        const tglLaporan = format(startDate, 'MMMM yyyy', { locale: id });
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- 1. Header ---
        // Tambahkan logo di kiri atas
        doc.addImage(logoBase64, 'PNG', 25, 17, 20, 30);

        doc.setFontSize(14).setFont('normal', 'bold');
        doc.text('LAPORAN PENGHIMPUNAN DANA BEASISWA', pageWidth / 2, 27, { align: 'center' });
        
        doc.setFontSize(12).setFont('normal', 'normal');
        doc.text(`IKATAN ALUMNI UNIVERSITAS PENDIDIKAN INDONESIA`, pageWidth / 2, 35, { align: 'center' });
        doc.text(`PERIODE ${tglLaporan.toUpperCase()}`, pageWidth / 2, 42, { align: 'center' });

        // --- 2. Tabel Data Donasi ---
        const tableBody = donations.map((d: DonationData, index: number) => [
            index + 1,
            format(new Date(d.tanggal_donasi), 'dd/MM/yyyy'),
            d.nama_donatur,
            new Intl.NumberFormat('id-ID').format(d.jumlah),
            d.keterangan || '-',
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['NO', 'TANGGAL', 'NAMA DONATUR', 'JUMLAH', 'KETERANGAN']],
            body: tableBody,
            foot: [['Jumlah', '', '', formatCurrency(pdfReportData.totalIncome), '']],
            theme: 'grid',
            headStyles: {
                fillColor: [225, 225, 225],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                2: { cellWidth: 50 },
                3: { halign: 'right' },
            },
            footStyles: {
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [44, 62, 80],
            },
        });

        // --- 3. Footer & Tanda Tangan ---
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
        const tglSurat = format(new Date(), 'd MMMM yyyy', { locale: id });

        doc.setFontSize(11).setFont('normal', 'normal');
        doc.text('Catatan:', pageWidth / 10 , finalY, { align: 'left' });
        doc.text('1. Di luar keterangan jumlah bulan berarti donasi berkala untuk satu bulan berjalan. Pencantuman jumlah bulan', pageWidth / 10 , finalY+5, { align: 'justify' });
        doc.text('berarti pembayaran sekaligus sesuai jumlah bulan.', pageWidth / 8.5 , finalY+10, { align: 'justify' });
        doc.text('2. Jumlah donasi sesuai dengan kategori yang dipilih saat apply menjadi donatur (Suksesi 1 Rp 98.200,00;', pageWidth / 10 , finalY+15, { align: 'justify' });
        doc.text('Suksesi 2 Rp 92.100,00; Suksesi 3 Rp 92.800,00). Di atas jumlah tersebut, berarti pembulatan dari', pageWidth / 8.5 , finalY+20, { align: 'justify' });
        doc.text('donatur yang bersangkutan. ', pageWidth / 8.5 , finalY+25, { align: 'justify' });

        doc.setFontSize(11).setFont('normal', 'normal');
        doc.text(`Bandung, ${tglSurat}`, pageWidth / 2, finalY + 35, { align: 'center' });
        doc.setFontSize(11).setFont('normal', 'bold');
        doc.text('PIC Beasiswa Ikatan Alumni', pageWidth / 2, finalY + 40, { align: 'center' });
        doc.text('Universitas Pendidikan Indonesia', pageWidth / 2, finalY + 45, { align: 'center' });

        doc.setFontSize(11).setFont('normal', 'bold');
        doc.text('Dr. Jakiatin Nisa, M.Pd.', pageWidth / 2, finalY + 70, { align: 'center' });
        
        doc.setFontSize(11).setFont('normal', 'normal');
        doc.text('B.12.2002.000001', pageWidth / 2, finalY + 75, { align: 'center' });

        // Simpan file
        doc.save(`Laporan Beasiswa - ${tglLaporan}.pdf`);

      } catch (error) {
        console.error("Gagal membuat PDF:", error);
        alert("Gagal membuat PDF. Cek konsol untuk detail.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* CSV Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Ekspor Data CSV
          </CardTitle>
          <CardDescription>
            Pilih rentang tanggal untuk mengekspor data donasi dan pengeluaran dalam format CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !csvDateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {csvDateRange?.from ? (
                    csvDateRange.to ? (
                      <>
                        {format(csvDateRange.from, 'd LLL, yy', { locale: id })} -{' '}
                        {format(csvDateRange.to, 'd LLL, yy', { locale: id })}
                      </>
                    ) : (
                      format(csvDateRange.from, 'd LLL, yy', { locale: id })
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={csvDateRange?.from}
                  selected={csvDateRange}
                  onSelect={setCsvDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleGenerateCsvReport} disabled={isCsvGenerating || !csvDateRange?.from || !csvDateRange?.to}>
              {isCsvGenerating ? 'Membuat Laporan...' : 'Buat Laporan'}
            </Button>
          </div>

          {isCsvGenerating && <p className="text-center text-muted-foreground">Memuat data laporan...</p>}

          {csvReportData && !isCsvGenerating && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle>Total Pemasukan</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(csvReportData.totalIncome)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Total Pengeluaran</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(csvReportData.totalExpenses)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Saldo Bersih</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(csvReportData.netBalance)}</CardContent>
                </Card>
              </div>
              
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => handleCsvExport('donations')} disabled={isCsvExporting}>
                  <Download size={16} className="mr-2" />
                  {isCsvExporting ? 'Mengekspor...' : `Ekspor ${csvReportData.donationCount} Data Donasi`}
                </Button>
                <Button variant="secondary" onClick={() => handleCsvExport('expenses')} disabled={isCsvExporting}>
                  <Download size={16} className="mr-2" />
                  {isCsvExporting ? 'Mengekspor...' : `Ekspor ${csvReportData.expenseCount} Data Pengeluaran`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ekspor Laporan PDF
          </CardTitle>
          <CardDescription>
            Pilih bulan untuk mengekspor laporan donasi dalam format PDF yang telah diformat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Pilih bulan laporan" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGeneratePdfReport} disabled={isPdfGenerating || !selectedMonth}>
              {isPdfGenerating ? 'Membuat Laporan...' : 'Buat Laporan PDF'}
            </Button>
          </div>

          {isPdfGenerating && <p className="text-center text-muted-foreground">Memuat data laporan...</p>}

          {pdfReportData && !isPdfGenerating && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle>Total Pemasukan</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(pdfReportData.totalIncome)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Total Pengeluaran</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(pdfReportData.totalExpenses)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Saldo Bersih</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(pdfReportData.netBalance)}</CardContent>
                </Card>
              </div>
              
              <Button onClick={handlePdfExport} disabled={isPdfExporting}>
                <Download size={16} className="mr-2" />
                {isPdfExporting ? 'Membuat PDF...' : 'Ekspor Laporan PDF'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
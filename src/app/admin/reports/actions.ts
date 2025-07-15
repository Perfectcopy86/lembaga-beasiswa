// src/app/admin/reports/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

type DateRange = { from: Date; to: Date };

// Tipe untuk data donasi mentah
type Donation = {
  tanggal_donasi: string;
  nama_donatur: string;
  jumlah: number;
  keterangan: string | null;
};

// Tipe untuk data pengeluaran mentah
type Expense = {
  tanggal: string;
  deskripsi: string;
  kategori: string;
  jumlah: number;
};


// --- Fungsi untuk mengambil data laporan ---
export async function getReportData(range: DateRange) {
  const supabase = await createClient();
  const { from, to } = range;

  // Ambil data donasi dalam rentang tanggal
  const { data: donations, error: donationsError } = await supabase
    .from('donations')
    .select('jumlah')
    .gte('tanggal_donasi', format(from, 'yyyy-MM-dd'))
    .lte('tanggal_donasi', format(to, 'yyyy-MM-dd'));

  if (donationsError) throw new Error(donationsError.message);

  const totalIncome = donations.reduce((sum, { jumlah }) => sum + jumlah, 0);

  // Ambil data pengeluaran dalam rentang tanggal
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('jumlah')
    .gte('tanggal', format(from, 'yyyy-MM-dd'))
    .lte('tanggal', format(to, 'yyyy-MM-dd'));
  
  if (expensesError) throw new Error(expensesError.message);

  const totalExpenses = expenses.reduce((sum, { jumlah }) => sum + jumlah, 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    donationCount: donations.length,
    expenseCount: expenses.length,
  };
}

// --- Fungsi untuk mengekspor data ke CSV ---

function convertToCSV(data: unknown[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(row => 
        headers.map(header => JSON.stringify((row as Record<string, unknown>)[header] || '')).join(',')
    );
    return [headerRow, ...rows].join('\n');
}

export async function exportDonationsToCsv(range: DateRange) {
    const supabase = await createClient();
    const { from, to } = range;

    const { data, error } = await supabase
        .from('donations')
        .select('id, tanggal_donasi, nama_donatur, jumlah, keterangan')
        .gte('tanggal_donasi', format(from, 'yyyy-MM-dd'))
        .lte('tanggal_donasi', format(to, 'yyyy-MM-dd'))
        .order('tanggal_donasi');

    if (error) throw new Error(error.message);
    
    const headers = ['id', 'tanggal_donasi', 'nama_donatur', 'jumlah', 'keterangan'];
    return convertToCSV(data, headers);
}

export async function exportExpensesToCsv(range: DateRange) {
    const supabase = await createClient();
    const { from, to } = range;

    const { data, error } = await supabase
        .from('expenses')
        .select('id, tanggal, deskripsi, kategori, jumlah, bukti')
        .gte('tanggal', format(from, 'yyyy-MM-dd'))
        .lte('tanggal', format(to, 'yyyy-MM-dd'))
        .order('tanggal');

    if (error) throw new Error(error.message);

    const headers = ['id', 'tanggal', 'deskripsi', 'kategori', 'jumlah', 'bukti'];
    return convertToCSV(data, headers);
}

// --- FUNGSI UNTUK MENGAMBIL DATA PDF ---
export async function getRawDataForPdf(range: DateRange): Promise<{ donations: Donation[], expenses: Expense[] }> {
  const supabase = await createClient();
  const { from, to } = range;

  // Ambil data donasi
  const { data: donationsData, error: donationsError } = await supabase
    .from('donations')
    .select('tanggal_donasi, nama_donatur, jumlah, keterangan')
    .gte('tanggal_donasi', format(from, 'yyyy-MM-dd'))
    .lte('tanggal_donasi', format(to, 'yyyy-MM-dd'))
    .order('tanggal_donasi');
  
  if (donationsError) throw new Error(donationsError.message);

  // Ambil data pengeluaran
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('tanggal, deskripsi, kategori, jumlah')
    .gte('tanggal', format(from, 'yyyy-MM-dd'))
    .lte('tanggal', format(to, 'yyyy-MM-dd'))
    .order('tanggal');
  
  if (expensesError) throw new Error(expensesError.message);

  return {
    donations: (donationsData as Donation[]) || [],
    expenses: (expensesData as Expense[]) || [],
  };
}
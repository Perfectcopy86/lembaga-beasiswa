"use client";

import { createClient } from "@/lib/supabase/client";
import React, { useState, useEffect } from 'react';
import { useRealtimeStatus } from '@/context/realtime-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- TYPE DEFINITION ---
interface MapDataItem {
  id: number;
  tanggal_alokasi: string;
  beswan: {
    nama_beswan: string | null;
    kode_beswan: string | null;
  } | null;
  donation_items: {
    id: number;
    kategori_beasiswa: {
      nama_kategori: string | null;
    } | null;
    donations: {
      nama_donatur: string | null;
      tanggal_donasi: string;
    } | null;
  } | null;
}

async function getMapData(): Promise<MapDataItem[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('alokasi_dana')
        .select(`
            id,
            tanggal_alokasi,
            beswan ( nama_beswan, kode_beswan ),
            donation_items (
                id,
                kategori_beasiswa ( nama_kategori ),
                donations ( nama_donatur, tanggal_donasi )
            )
        `)
        .order('tanggal_alokasi', { ascending: false });

    if (error) {
        console.error("Error fetching map data:", error.message);
        return [];
    }
    return (data as unknown as MapDataItem[]) || [];
}

export default function MapPage() {
    const [mapData, setMapData] = useState<MapDataItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

    useEffect(() => {
        const fetchData = async () => {
            const data = await getMapData();
            setMapData(data);
        };

        fetchData();

        const handleReconnect = () => {
            console.log("Reconnected to Supabase!");
            fetchData();
        };

        addReconnectListener(handleReconnect);

        return () => {
            removeReconnectListener(handleReconnect);
        };
    }, [addReconnectListener, removeReconnectListener]);

    const getSafe = (data: MapDataItem, path: string, fallback: string | Date = 'N/A') => {
        const parts = path.split('.');
        let current: unknown = data;

        for (const part of parts) {
            if (typeof current !== 'object' || current === null) {
                return fallback;
            }
            current = (current as Record<string, unknown>)[part];
        }
        return current ?? fallback;
    }
    
    const uniqueCategories = Array.from(new Set(mapData.map(item => getSafe(item, 'donation_items.kategori_beasiswa.nama_kategori', '') as string).filter(Boolean)));

    const filteredData = mapData.filter(item => {
        const namaDonatur = getSafe(item, 'donation_items.donations.nama_donatur', '').toString().toLowerCase();
        const namaPenerima = getSafe(item, 'beswan.nama_beswan', '').toString().toLowerCase();
        const kategoriBeasiswa = getSafe(item, 'donation_items.kategori_beasiswa.nama_kategori', '').toString();
        const query = searchQuery.toLowerCase();

        const matchesSearchQuery = namaDonatur.includes(query) || namaPenerima.includes(query);
        const matchesCategory = selectedCategory ? kategoriBeasiswa === selectedCategory : true;

        return matchesSearchQuery && matchesCategory;
    });

    return (
        // Menambahkan `max-w-full overflow-x-hidden` untuk memastikan tidak ada overflow horizontal
        <div className="w-full max-w-full overflow-x-hidden"> 
            <div className="container mx-auto py-4 sm:py-8 px-4">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Peta Donatur-Penerima</h1>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari berdasarkan Nama Donatur atau Penerima..."
                        className="w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none"
                    />
                     <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-500 focus:outline-none"
                    >
                        <option value="">Semua Kategori</option>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Donatur</TableHead>
                                <TableHead>Beasiswa</TableHead>
                                <TableHead>Tanggal Donasi</TableHead>
                                <TableHead>Nama Penerima</TableHead>
                                <TableHead>Tanggal Alokasi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item: MapDataItem) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{getSafe(item, 'donation_items.donations.nama_donatur')?.toString()}</TableCell>
                                        <TableCell>{getSafe(item, 'donation_items.kategori_beasiswa.nama_kategori')?.toString()}</TableCell>
                                        <TableCell>{new Date(String(getSafe(item, 'donation_items.donations.tanggal_donasi', ''))).toLocaleDateString('id-ID')}</TableCell>
                                        <TableCell className="font-semibold">{getSafe(item, 'beswan.nama_beswan')?.toString()}</TableCell>
                                        <TableCell>{new Date(String(getSafe(item, 'tanggal_alokasi', ''))).toLocaleDateString('id-ID')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        {mapData.length === 0 ? "Belum ada data alokasi." : "Data tidak ditemukan."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
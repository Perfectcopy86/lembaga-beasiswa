"use client";

// UBAH BARIS INI: Impor dari 'client' bukan 'server'
import { createClient } from "@/lib/supabase/client"; 
import React, { useState, useEffect } from 'react';
import { useRealtimeStatus } from '@/context/realtime-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- TYPE DEFINITION ---
// A specific interface that matches the data structure from your Supabase query
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


// Fungsi getMapData sekarang akan menggunakan client-side Supabase client
async function getMapData(): Promise<MapDataItem[]> { // Return a promise of our specific type
    // createClient() di sini akan memanggil versi dari @/lib/supabase/client
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
    // Cast the returned data to our specific type
    return (data as unknown as MapDataItem[]) || [];
}

// Sisa kode komponen Anda tetap sama...
export default function MapPage() {
    const [mapData, setMapData] = useState<MapDataItem[]>([]); // Use the specific type here
    const [searchQuery, setSearchQuery] = useState(''); 
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
    let current: unknown = data; // Start with the data object

    for (const part of parts) {
        // If current is not a valid object, we can't continue traversing.
        if (typeof current !== 'object' || current === null) {
            return fallback;
        }
        // Access the next part of the path on the current object.
        current = (current as Record<string, unknown>)[part];
    }

    // Return the final value, or the fallback if it's null/undefined.
    // Using ?? is safer than || because it won't replace falsy values like ''.
    return current ?? fallback;
}

    const filteredData = mapData.filter(item => {
        const namaDonatur = getSafe(item, 'donation_items.donations.nama_donatur', '').toString().toLowerCase();
        const namaPenerima = getSafe(item, 'beswan.nama_beswan', '').toString().toLowerCase();
        const query = searchQuery.toLowerCase();
    
        return namaDonatur.includes(query) || namaPenerima.includes(query);
    });

    return (
    <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Peta Donatur-Penerima</h1>
        <div className="mb-4">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama Donatur atau Penerima..."
                className="w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none"
            />
        </div>
        <div className="rounded-md border">
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
                    {filteredData.map((item: MapDataItem) => (
                        <TableRow key={item.id}>
                            <TableCell>{getSafe(item, 'donation_items.donations.nama_donatur')?.toString()}</TableCell>
                            <TableCell>{getSafe(item, 'donation_items.kategori_beasiswa.nama_kategori')?.toString()}</TableCell>
                            <TableCell>{new Date(String(getSafe(item, 'donation_items.donations.tanggal_donasi', ''))).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="font-semibold">{getSafe(item, 'beswan.nama_beswan')?.toString()}</TableCell>
                            <TableCell>{new Date(String(getSafe(item, 'tanggal_alokasi', ''))).toLocaleDateString('id-ID')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        {mapData.length === 0 && <p className="text-center py-8">Belum ada data alokasi.</p>}
    </div>
);
}
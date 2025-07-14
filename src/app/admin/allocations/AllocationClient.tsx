'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';


import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createAllocation } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function AllocationClient() {
    const [items, setItems] = useState<any[]>([]);
    const [beswanList, setBeswanList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [selectedBeswan, setSelectedBeswan] = useState<any | null>(null);
    const [isPending, startTransition] = useTransition();

    const supabase = createClient();
    // const router = useRouter();
    // Kita tetap panggil hook ini, meskipun tidak diandalkan untuk re-koneksi
    // const { addReconnectListener, removeReconnectListener } = useRealtimeStatus();

    // Fungsi untuk mengambil data (tidak ada perubahan di sini)
    const fetchData = useCallback(async () => {
        // Tampilkan loading skeleton setiap kali fetching dimulai ulang
        setLoading(true);
        setError(null);
        try {
            const { data: allocatedData, error: allocatedIdsError } = await supabase
                .from('alokasi_dana').select('donation_item_id');
            if (allocatedIdsError) throw allocatedIdsError;

            const idsToExclude = allocatedData.map(item => item.donation_item_id);
            let query = supabase.from('donation_items').select(`
                id, donations:donation_id(nama_donatur), kategori_beasiswa:kategori_id(nama_kategori)
            `);
            if (idsToExclude.length > 0) {
                query = query.not('id', 'in', `(${idsToExclude.join(',')})`);
            }
            const { data: unallocatedItems, error: itemsError } = await query;
            if (itemsError) throw itemsError;

            const { data: allBeswan, error: beswanError } = await supabase.from('beswan').select('*');
            if (beswanError) throw beswanError;

            setItems(unallocatedItems || []);
            setBeswanList(allBeswan || []);

        } catch (err: any) {
            console.error("Error fetching allocation data:", err);
            setError("Gagal memuat data. Periksa koneksi Anda.");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Effect untuk memuat data pertama kali
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Effect untuk Supabase realtime (untuk update data jika ada perubahan di DB)
    useEffect(() => {
        const handleDataChange = () => fetchData();
        const channel = supabase.channel('allocations-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'alokasi_dana' }, handleDataChange)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_items' }, handleDataChange)
          .subscribe();
        
        // Tetap pasang listener ini sebagai fallback
        // addReconnectListener(fetchData);

        return () => {
            supabase.removeChannel(channel);
            // removeReconnectListener(fetchData);
        };
    }, [supabase, fetchData]);

    // ✅ PERBAIKAN UTAMA: Tambahkan effect untuk mendeteksi koneksi kembali online
    

    const handleAllocate = () => {
        if (!selectedItem || !selectedBeswan) {
            toast.warning('Pilih satu slot donasi dan satu beswan terlebih dahulu.');
            return;
        }
        startTransition(async () => {
            const result = await createAllocation(selectedItem.id, selectedBeswan.id);
            if (result.error) {
                toast.error('Gagal Alokasi', { description: result.error });
            } else {
                toast.success('Alokasi berhasil!');
                setSelectedItem(null);
                setSelectedBeswan(null);
                fetchData(); 
            }
        });
    }

    // Tampilan saat loading
    if (loading) {
      return (
          <div className="grid md:grid-cols-2 gap-8">
              <div>
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
              </div>
              <div>
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
              </div>
          </div>
      );
    }

    // Tampilan saat error
    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    // Tampilan utama
    return (
        <div>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Slot Donasi Tersedia ({items.length})</h2>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {items.length > 0 ? items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedItem?.id === item.id 
                                        ? 'bg-primary/10 ring-2 ring-primary'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <p className="font-bold">{item.kategori_beasiswa?.nama_kategori || 'Kategori tidak diketahui'}</p>
                                <p className="text-sm text-muted-foreground">Dari: {item.donations?.nama_donatur || 'Donatur tidak diketahui'}</p>
                            </div>
                        )) : <p className="text-muted-foreground text-center py-4">Tidak ada slot donasi tersedia.</p>}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Beswan Tersedia ({beswanList.length})</h2>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {beswanList.length > 0 ? beswanList.map((beswan) => (
                            <div
                                key={beswan.id}
                                onClick={() => setSelectedBeswan(beswan)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedBeswan?.id === beswan.id 
                                        ? 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500' 
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <p className="font-bold">{beswan.nama_beswan}</p>
                                <p className="text-sm text-muted-foreground">Kode: {beswan.kode_beswan || 'N/A'}</p>
                            </div>
                        )) : <p className="text-muted-foreground text-center py-4">Tidak ada data beswan.</p>}
                    </div>
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center">
                <Button onClick={handleAllocate} disabled={!selectedItem || !selectedBeswan || isPending} size="lg">
                    {isPending ? 'Mengalokasikan...' : 'Hubungkan Donasi dengan Beswan'}
                </Button>
                {selectedItem && selectedBeswan && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Akan menghubungkan: <br />
                        <span className="font-semibold text-primary">{selectedItem.donations?.nama_donatur}'s {selectedItem.kategori_beasiswa?.nama_kategori}</span>
                        {' -> '}
                        <span className="font-semibold text-green-600">{selectedBeswan.nama_beswan}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
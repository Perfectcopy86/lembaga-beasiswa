import { createClient } from "@/lib/supabase/server";
import AllocationClient from './AllocationClient';

// --- FUNGSI PENGAMBILAN DATA YANG DIPERBARUI ---

export default async function AllocationPage() {
    // Komponen ini sekarang hanya merender AllocationClient tanpa mengirimkan properti.
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Alokasi Dana Donatur ke Beswan</h1>
            <AllocationClient />
        </div>
    )
}

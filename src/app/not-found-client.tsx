// src/app/not-found-client.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Komponen ini akan menangani logika yang butuh 'useSearchParams'
export function NotFoundClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - Halaman Tidak Ditemukan</h1>
      <p>Maaf, kami tidak dapat menemukan halaman yang Anda cari.</p>
      {/* Tampilkan pesan error jika ada di URL */}
      {error && <p style={{ color: 'red' }}>Detail error: {error}</p>}
      <Link href="/">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
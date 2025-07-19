// src/app/not-found.tsx
import { Suspense } from 'react';
import { NotFoundClient } from './not-found-client'; // Impor komponen baru

// Komponen fallback sederhana untuk ditampilkan saat loading
function LoadingFallback() {
    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Memuat...</h1>
        </div>
    );
}

// Halaman not-found utama
export default function NotFound() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotFoundClient />
    </Suspense>
  );
}
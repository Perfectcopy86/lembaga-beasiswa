// src/components/ui/navigation-loader.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Sembunyikan loader setiap kali URL berubah
    setLoading(false);
  }, [pathname, searchParams]);

  // Implementasi sederhana untuk mendeteksi awal navigasi
  // Kita akan menyempurnakannya di layout
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Cek apakah yang diklik adalah link internal Next.js
      const anchor = target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin) && anchor.target !== '_blank') {
         // Cek jika link tidak mengarah ke halaman yang sama persis
         if (anchor.pathname + anchor.search !== window.location.pathname + window.location.search) {
            setLoading(true);
         }
      }
    };
    
    // Cek tombol submit form
    const handleFormSubmit = (e: SubmitEvent) => {
        setLoading(true);
    }

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleFormSubmit);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, []);


  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-primary animate-pulse" style={{ animation: 'loading-bar 1.5s ease-in-out infinite' }}></div>
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 80%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
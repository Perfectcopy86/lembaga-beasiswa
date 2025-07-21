// /lib/hooks/useMediaQuery.ts

import { useState, useEffect } from 'react';

/**
 * Custom hook untuk mendeteksi ukuran layar berdasarkan media query.
 * @param query String media query (e.g., "(min-width: 768px)")
 * @returns boolean - true jika query cocok, false jika tidak.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Pastikan kode ini hanya berjalan di sisi client
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
// src/app/not-found-client.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function NotFoundClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      {error && <p style={{ color: 'red' }}>Error details: {error}</p>}
      <Link href="/">
        Go back to Homepage
      </Link>
    </div>
  );
}
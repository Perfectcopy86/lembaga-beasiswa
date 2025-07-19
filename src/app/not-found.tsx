// src/app/not-found.tsx
import { Suspense } from 'react';
import { NotFoundClient } from './not-found-client';

// A simple loading fallback
function Loading() {
    return <div>Loading...</div>;
}

export default function NotFound() {
  return (
    <Suspense fallback={<Loading />}>
      <NotFoundClient />
    </Suspense>
  );
}
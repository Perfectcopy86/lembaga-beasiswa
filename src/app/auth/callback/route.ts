// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // PASTIKAN BARIS INI MENGARAH KE HALAMAN YANG BENAR
      // Arahkan ke halaman untuk membuat password baru
      return NextResponse.redirect(new URL('/auth/update-password', request.url));
    }
  }

  // Jika terjadi error, arahkan ke halaman login dengan pesan error
  return NextResponse.redirect(new URL('/auth?message=Gagal melakukan autentikasi. Silakan coba lagi.', request.url));
}
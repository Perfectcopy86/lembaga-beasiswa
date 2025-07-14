// src/app/auth/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return redirect('/auth?message=Email dan password harus diisi.')
  }

  const { data: { user }, error } = await (await supabase).auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return redirect('/auth?message=Gagal masuk. Periksa kembali email dan password Anda.')
  }

  if (user) {
    const { data: profile } = await (await supabase)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
        revalidatePath('/admin', 'layout')
        redirect('/admin')
    }
  }

  revalidatePath('/home', 'layout')
  redirect('/home')
}
// ... (fungsi lainnya tetap sama)
export async function loginAsGuest() {
    const supabase = createClient()

    const guestEmail = process.env.GUEST_EMAIL;
    const guestPassword = process.env.GUEST_PASSWORD;

    if (!guestEmail || !guestPassword) {
        console.error('Guest credentials not set in .env file');
        return redirect('/auth?message=Login tamu saat ini tidak tersedia.');
    }

    const { error } = await (await supabase).auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
    })

    if (error) {
        console.error('Guest login error:', error.message)
        return redirect('/auth?message=Gagal masuk sebagai tamu.')
    }

    revalidatePath('/home', 'layout')
    redirect('/home') // Arahkan ke halaman home
}

export async function signup(formData: FormData) {
  const supabase = createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const konfirmasi_password = formData.get('konfirmasi_password') as string
  const nama_donatur = formData.get('nama_donatur') as string
  const jenis_kelamin = formData.get('jenis_kelamin') as string
  
  if (!email || !password || !nama_donatur || !jenis_kelamin || !konfirmasi_password) {
    return redirect('/auth?message=Semua field harus diisi.')
  }
 
  if (password !== konfirmasi_password) {
    return redirect('/auth?message=Password dan konfirmasi password tidak cocok.')
  }

  if (password.length < 6) {
    return redirect('/auth?message=Password minimal harus 6 karakter.')
  }

  const { data: { user }, error } = await (await supabase).auth.signUp({
    email,
    password,
    options: {
      data: {
        nama_donatur: nama_donatur,
        jenis_kelamin: jenis_kelamin,
      },
    },
  })

  if (error) {
    console.error('Signup error:', error.message)
    
    if (error.message.includes('User already registered')) {
      return redirect('/auth?message=Email ini sudah terdaftar. Silakan gunakan email lain.')
    }
    
    return redirect('/auth?message=Gagal mendaftar. Silakan coba lagi.')
  }

  revalidatePath('/', 'layout')
  redirect('/auth/confirm')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/auth')
}
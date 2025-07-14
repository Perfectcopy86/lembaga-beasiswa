// src/app/auth/forgot-password/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return redirect('/auth/forgot-password?error=Email harus diisi.')
  }

  // URL yang akan dituju setelah user mengklik link di email
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    console.error('Password reset error:', error.message)
    return redirect(`/auth/forgot-password?error=Gagal mengirim email reset. ${error.message}`)
  }

  return redirect('/auth/forgot-password?message=Email reset password telah dikirim. Silakan periksa inbox Anda.')
}
// src/app/auth/forgot-password/page.tsx
'use client'

import { requestPasswordReset } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Suspense } from 'react' 

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const error = searchParams.get('error')

  if (message) {
    return (
      // MODIFICATION: Responsive card width
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <MailCheck className="w-16 h-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl">Tautan Telah Dikirim!</CardTitle>
          <CardDescription className="pt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Tautan tersebut hanya berlaku untuk waktu yang singkat. Jika Anda tidak menerimanya dalam beberapa menit, periksa folder spam Anda.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth">Kembali ke Halaman Login</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    // MODIFICATION: Responsive card width
    <Card className="w-full max-w-sm">
      <form action={requestPasswordReset}>
        <CardHeader>
          <CardTitle>Lupa Password</CardTitle>
          <CardDescription>
            Masukkan alamat email Anda. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                  {error}
              </p>
          )}
          <Input id="email" name="email" type="email" placeholder="Email" required />
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button type="submit" className="w-full">Kirim Tautan Reset</Button>
          <Button variant="link" asChild>
            <Link href="/auth">Kembali ke Login</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ForgotPasswordPage() {
  return (
    // MODIFICATION: Added padding for mobile view
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
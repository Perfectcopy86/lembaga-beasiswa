// src/app/auth/update-password/page.tsx
'use client'

import { updatePassword } from '@/app/(dashboard)/profile/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [message, setMessage] = useState<{ success?: string; error?: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    const result = await updatePassword(formData)
    setMessage(result)
    if (result.success) {
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth')
      }, 2000)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[400px]">
        <form action={handleSubmit}>
          <CardHeader>
            <CardTitle>Buat Password Baru</CardTitle>
            <CardDescription>
              Silakan masukkan password baru Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
                <Input id="confirm_password" name="confirm_password" type="password" required />
              </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            {message && (
                <p className={`text-sm ${message.error ? 'text-red-500' : 'text-green-500'}`}>
                  {message.error || `${message.success} Anda akan diarahkan ke halaman login...`}
                </p>
            )}
            <Button type="submit" className="w-full">Simpan Password Baru</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
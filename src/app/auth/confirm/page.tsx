import Link from 'next/link'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ConfirmPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Pendaftaran Berhasil</CardTitle>
          <CardDescription>
            Silakan periksa email Anda untuk konfirmasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kami telah mengirimkan email konfirmasi ke alamat email yang Anda daftarkan. 
            Silakan klik tautan di email tersebut untuk mengaktifkan akun Anda.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Jika Anda tidak menerima email dalam beberapa menit, periksa folder spam atau coba daftar ulang.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/auth">Kembali ke Halaman Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
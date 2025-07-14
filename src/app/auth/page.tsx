// src/app/auth/page.tsx
"use client"

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link' // <-- Tambahkan import Link

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 to-slate-300 font-sans">
      <div
        className={`bg-white rounded-3xl shadow-2xl relative overflow-hidden w-[768px] max-w-full min-h-[520px] transition-all duration-700 ease-in-out ${isSignUp ? 'md:w-[768px]' : ''}`}
      >
        {/* FORM REGISTER */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 ${isSignUp ? 'translate-x-full opacity-100 z-[5]' : 'opacity-0 z-[1]'}`}
        >
          <form action={signup} className="bg-white flex items-center justify-center flex-col px-10 h-full text-center">
            <h1 className="text-2xl font-bold mb-4 text-black">Buat Akun Baru</h1>

            {message && isSignUp && (
              <div className="p-3 mb-3 text-xs text-red-800 rounded-lg bg-red-50 w-full">
                {message}
              </div>
            )}

            <Input id="nama_donatur" name="nama_donatur" placeholder="Nama Lengkap" required className="bg-gray-200 border-none my-2 p-3 text-sm rounded-lg w-full outline-none text-black" />
            <Input id="email-register" name="email" type="email" placeholder="Email" required className="bg-gray-200 border-none my-2 p-3 text-sm rounded-lg w-full outline-none text-black" />
            <Input id="password-register" name="password" type="password" placeholder="Password (min. 6 karakter)" required className="bg-gray-200 border-none my-2 p-3 text-sm rounded-lg w-full outline-none text-black" />
            <Input id="konfirmasi_password" name="konfirmasi_password" type="password" placeholder="Konfirmasi Password" required className="bg-gray-200 border-none my-2 p-3 text-sm rounded-lg w-full outline-none text-black" />


            <div className="w-full my-2">
              <Select name="jenis_kelamin" required>
                <SelectTrigger className="bg-gray-200 border-none text-sm rounded-lg w-full outline-none text-black">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="bg-blue-700 text-white text-sm py-3 px-11 border border-transparent rounded-lg font-semibold tracking-wider uppercase mt-4 cursor-pointer">
              Daftar
            </Button>
          </form>
        </div>

        {/* FORM LOGIN */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[2] ${!isSignUp ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <form action={login} className="bg-white flex items-center justify-center flex-col px-10 h-full text-center">
            <h1 className="text-2xl font-bold mb-4 text-black">Masuk</h1>

            {message && !isSignUp && (
              <div className="p-3 mb-3 text-xs text-red-800 rounded-lg bg-red-50 w-full">
                {message}
              </div>
            )}

            <Input id="email" name="email" type="email" placeholder="Email" required className="bg-gray-200 border-none my-2 p-3 text-sm rounded-lg w-full outline-none text-black" />
            <Input id="password" name="password" type="password" placeholder="Password" required className="bg-gray-200 border-none my-2 p-3 text-sm rounded-lg w-full outline-none text-black" />
            
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline mt-2">
                Lupa Password?
            </Link>

            <Button type="submit" className="bg-blue-700 text-white text-sm py-3 px-11 border border-transparent rounded-lg font-semibold tracking-wider uppercase mt-4 cursor-pointer">
              Masuk
            </Button>
          </form>
        </div>

        {/* TOGGLE CONTAINER */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 ${isSignUp ? '-translate-x-full' : 'translate-x-0'}`}>
          <div 
            className={`bg-gradient-to-r from-blue-800 to-blue-500 text-white relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}
          >
            {/* Toggle Left */}
            <div className={`absolute w-1/2 h-full flex items-center justify-center flex-col px-8 text-center top-0 transform transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-0' : '-translate-x-[200%]'}`}>
              <h1 className="text-2xl font-bold">Selamat Datang Kembali!</h1>
              <p className="text-sm tracking-wide leading-5 m-5">
                Silakan masukkan detail pribadi Anda untuk menggunakan semua fitur situs.
              </p>
              <Button
                onClick={() => setIsSignUp(false)}
                className="bg-transparent border-2 border-white text-white text-sm py-3 px-11 rounded-lg font-semibold tracking-wider uppercase mt-2 cursor-pointer"
              >
                Masuk
              </Button>
            </div>
            {/* Toggle Right */}
            <div className={`absolute w-1/2 h-full flex items-center justify-center flex-col px-8 text-center top-0 right-0 transform transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-[200%]' : 'translate-x-0'}`}>
              <h1 className="text-2xl font-bold">Halo, Teman!</h1>
              <p className="text-sm tracking-wide leading-5 m-5">
                Daftarkan diri Anda dengan detail pribadi untuk menggunakan semua fitur situs.
              </p>
              <Button
                onClick={() => setIsSignUp(true)}
                className="bg-transparent border-2 border-white text-white text-sm py-3 px-11 rounded-lg font-semibold tracking-wider uppercase mt-2 cursor-pointer"
              >
                Daftar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
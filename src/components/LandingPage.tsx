"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";

// Menggunakan export default agar sesuai dengan standar import di page.tsx
export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false); // State untuk menandai client-side render

  useEffect(() => {
    setIsVisible(true);
    setIsClient(true); // Set true setelah komponen di-mount di client

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGoToHome = () => {
    window.location.href = "/home";
  };



  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 25%, rgba(236, 72, 153, 0.1) 50%, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />

        {/* Floating Particles - Perbaikan di sini */}
        {isClient &&
          [...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-ping" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Lembaga Beasiswa IKA UPI
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Floating Badge */}
          <div
            className={`inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 text-blue-300 px-6 py-3 rounded-full text-sm font-medium mb-12 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Platform Donasi Beasiswa IKA UPI
            <TrendingUp className="w-4 h-4 ml-2" />
          </div>

          {/* Main Heading with 3D Effect */}
          <h1
            className={`text-6xl md:text-8xl font-black mb-8 leading-tight transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-20 opacity-0"
            }`}
            style={{
              textShadow:
                "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(147, 51, 234, 0.3)",
              transform: `perspective(1000px) rotateX(${
                mousePosition.y * 0.02 - 1
              }deg) rotateY(${mousePosition.x * 0.02 - 1}deg)`,
            }}
          >
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              MASA DEPAN
            </span>
            <span className="block bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              PENDIDIKAN
            </span>
          </h1>

          <p
            className={`text-xl md:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-20 opacity-0"
            }`}
          >
            Platform dashboard donasi beasiswa yang menghubungkan para donatur
            dengan mahasiswa untuk menciptakan masa depan Indonesia yang lebih
            cerah
          </p>

          {/* 3D CTA Button */}
          <div
            className={`transform transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-20 opacity-0"
            }`}
          >
            <button
              onClick={handleGoToHome}
              className="group relative px-12 py-6 text-xl font-bold text-white rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300"
              style={{
                background: "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)",
                boxShadow:
                  "0 20px 40px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                transform: `perspective(1000px) rotateX(${
                  mousePosition.y * 0.01
                }deg) rotateY(${mousePosition.x * 0.01}deg) scale(1)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center">
                <BookOpen className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                Masuki Dashboard
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </button>
          </div>

          {/* Trust Indicators with 3D Effect */}
          <div className="flex items-center justify-center mt-12 space-x-8 text-sm text-gray-400">
            {[
              { icon: CheckCircle, text: "Realtime Tracking" },
            //   { icon: Star, text: "3D Secured" },
            //   { icon: Award, text: "Hologram Certified" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center transform hover:scale-110 transition-transform duration-300"
                style={{
                  transform: `perspective(500px) rotateX(${
                    mousePosition.y * 0.005
                  }deg)`,
                }}
              >
                <item.icon className="w-5 h-5 text-green-400 mr-2" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ... Sisa kode komponen tidak perlu diubah, bisa ditempelkan di sini ... */}

    </div>
  );
}
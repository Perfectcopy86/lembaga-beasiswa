// File: home/page.tsx
'use client';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import OverviewTab from "./components/overview";
import TrendsAnalyticsTab from "./components/trends-analytics";
import BehaviorTab from "./components/behavior";
import TopPerformersTab from "./components/top-performers";
import DistributionTab from "./components/distribution";

export default function DashboardHomePage() {
  return (
    // Div terluar ini TIDAK memiliki padding.
    // 'w-full' dan 'overflow-x-hidden' memastikan tidak ada yang bisa bocor keluar dari layar.
    <div className="w-full overflow-x-hidden">
      <Tabs defaultValue="overview" className="w-full">
        
        {/* Bagian untuk TabsList yang bisa di-scroll.
            Ini sengaja diletakkan di luar div padding agar bisa memanjang selebar layar. */}
        <div className="w-full border-b">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max ml-4 md:ml-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="performers">Top Performers</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* KUNCI UTAMA: Div ini adalah WADAH KONTEN.
            Semua padding horizontal halaman (px-4) hanya ada di sini.
            Semua komponen <TabsContent> dimasukkan ke dalamnya. */}
        <div className="mt-4 px-4 md:px-6">
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="trends">
              <TrendsAnalyticsTab />
            </TabsContent>
            <TabsContent value="distribution">
              <DistributionTab/>
            </TabsContent>
            <TabsContent value="behavior">
              <BehaviorTab/>
            </TabsContent>
            <TabsContent value="performers">
              <TopPerformersTab />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
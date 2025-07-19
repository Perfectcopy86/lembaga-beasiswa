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
      <Tabs defaultValue="overview">
        {/* 1. Hapus kelas grid di sini */}
        <TabsList>
          {/* 2. Tambahkan 'flex-1' ke setiap trigger */}
          <TabsTrigger value="overview" className="cursor-pointer" >Overview</TabsTrigger>
          <TabsTrigger value="trends" className="cursor-pointer">Trends & Analytics</TabsTrigger>
          <TabsTrigger value="distribution" className="cursor-pointer">Distribution</TabsTrigger>
          <TabsTrigger value="behavior" className="cursor-pointer">Behavior</TabsTrigger>
          <TabsTrigger value="performers" className="cursor-pointer">Top Performers</TabsTrigger>
        </TabsList>
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
      </Tabs>
    )
  }
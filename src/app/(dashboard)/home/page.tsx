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
          <TabsTrigger value="overview" >Overview</TabsTrigger>
          <TabsTrigger value="trends" >Trends & Analytics</TabsTrigger>
          <TabsTrigger value="distribution" >Distribution</TabsTrigger>
          <TabsTrigger value="behavior" >Behavior</TabsTrigger>
          <TabsTrigger value="performers" >Top Performers</TabsTrigger>
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
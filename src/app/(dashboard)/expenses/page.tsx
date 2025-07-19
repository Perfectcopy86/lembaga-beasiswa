'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "./components/overview";
import AnalyticsTab from "./components/analytics";
import DetailsTab from "./components/details";

export default function ExpensesPage() {
  return (
    // TAMBAHKAN `overflow-hidden` DI SINI
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pengeluaran</h1>
        <p className="text-muted-foreground">
          Analisis dan lacak semua pengeluaran dana beasiswa dan operasional.
        </p>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
          <TabsTrigger value="details" className="cursor-pointer">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <DetailsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
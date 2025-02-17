import type { Metadata } from "next";
import { UserMetrics } from "@/components/ecommerce/UserMetrics";
import React from "react";
import MonthlySalesChart from "@/components/ecommerce/DailyViewsChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/UsersSignedup";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import RevenueDetails from "@/components/ecommerce/RevenueDetails";

export const metadata: Metadata = {
  title:
    "NodSync Admin Dashboard",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <UserMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <RevenueDetails />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}

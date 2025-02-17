import type { Metadata } from "next";
import {  UserMetrics } from "@/components/ecommerce/UserMetrics";
import React from "react";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/UsersSignedup";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import RevenueDetails from "@/components/ecommerce/RevenueDetails";
import DailyViews from "@/components/ecommerce/DailyViewsChart";

export const metadata: Metadata = {
  title: "NodSync Admin Dashboard",
  description: "NodSync Admin Dashboard",
};

export default function BlankPage() {
  return (
    <div>
       <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
              <UserMetrics />
      
             <DailyViews/>
            </div>
      
            <div className="col-span-12 xl:col-span-5 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
            <RevenueDetails/>
            <RecentOrders/>
            </div>
             
            </div>
          </div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Card Title Here
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Start putting content on grids or panels, you can also use different
            combinations of grids.Please check out the dashboard and other pages
          </p>
        </div>
      </div>
    </div>
  );
}

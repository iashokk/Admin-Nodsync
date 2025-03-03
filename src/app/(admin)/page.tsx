import { UserMetrics } from "@/components/ecommerce/UserMetrics";
import React from "react";
import UsersSignedup from "@/components/ecommerce/UsersSignedup";
import RevenueDetails from "@/components/ecommerce/RevenueDetails";
import DailyViews from "@/components/ecommerce/DailyViewsChart";
import LogTable from "@/components/tables/LogTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NodSync Admin Dashboard",
  description: "NodSync Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};



export default function Dashboard() {
  

  return (
    <div>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <UserMetrics />
        </div>

        <div className="col-span-12 xl:col-span-5 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <RevenueDetails
            />
          </div>
        </div>
      </div>
      <div className="mt-2 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
          Newly Signed Up Users
        </h3>
        <UsersSignedup />
      </div>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
          Logs
        </h3>
        <LogTable />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import React from "react";

import ContactTable from "@/components/tables/ContactTable";
import { UserMetrics } from "@/components/ecommerce/UserMetrics";
import RevenueDetails from "@/components/ecommerce/RevenueDetails";
export const metadata: Metadata = {
  title: "NodSync Contact Dashboard",
  description: "NodSync Admin Dashboard",
};

export default function Contact() {
  return (
    <div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <UserMetrics />

        </div>
      </div>

      <h3 className="mt-4 mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
        Contact Details
      </h3>
      <ContactTable />


    </div>
  );
}

"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function RevenueDetails() {
  // Static investment value remains unchanged
  const investment = 2000;
  const [revenue, setRevenue] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);

  // Fetch revenue from "income" collection now
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const incomesCollection = collection(firestore, "income");
        const q = query(incomesCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const total = snapshot.docs.reduce((sum, docSnap) => {
          const data = docSnap.data();
          return sum + Number(data.amount);
        }, 0);
        setRevenue(total);
        // setNetProfit(total - investment); // Not subracting it for now
        setNetProfit(total);
      } catch (error) {
        console.error("Error fetching revenue:", error);
      }
    };
    fetchRevenue();
  }, [investment]);

  const series = [revenue];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Revenue"],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-1 pt-1 bg-white shadow-default rounded-2xl pb-3 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Revenue for NodSync
            </h3>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Investment
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₹ {investment.toFixed(2)}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Revenue
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₹ {revenue.toFixed(2)}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Net Profit
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₹ {netProfit.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

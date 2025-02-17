"use client";

import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";
import { collection, getCountFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export const UserMetrics = () => {

  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Get count for "contacts" collection
        const contactsRef = collection(firestore, "contacts");
        const contactsSnapshot = await getCountFromServer(contactsRef);
        const contactsTotal = contactsSnapshot.data().count;

        // Get counts for "users" and "old_users" collections
        const usersRef = collection(firestore, "users");
        const oldUsersRef = collection(firestore, "old_users");

        const [usersSnapshot, oldUsersSnapshot] = await Promise.all([
          getCountFromServer(usersRef),
          getCountFromServer(oldUsersRef),
        ]);
        const totalUsers = usersSnapshot.data().count + oldUsersSnapshot.data().count;

        setContactsCount(contactsTotal);
        setUsersCount(totalUsers);
      } catch (err: any) {
        console.error("Error fetching counts:", err);
        setError("Failed to fetch metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Users Signed Up
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              { (loading) ? "Loading..." : (error) ? "Error..." : usersCount }
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Contacts Received
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            { (loading) ? "Loading..." : (error) ? "Error..." : contactsCount }
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};

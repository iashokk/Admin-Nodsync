"use client";
import React, { useEffect, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";
import { collection, getCountFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Badge from "../ui/badge/Badge";

interface StoredMetrics {
  count: number;
  timestamp: number;
  lastView: number | null;
}

export const UserMetrics = () => {
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New states for difference (new users/contacts count)
  const [usersDiff, setUsersDiff] = useState<number>(0);
  const [contactsDiff, setContactsDiff] = useState<number>(0);

  // Use a 120-minute window (in milliseconds)
  const windowMs = 120 * 60 * 1000;

  const fetchCounts = async () => {
    try {
      // Fetch contacts count
      const contactsRef = collection(firestore, "contacts");
      const contactsSnapshot = await getCountFromServer(contactsRef);
      const contactsTotal = contactsSnapshot.data().count;
      setContactsCount(contactsTotal);

      // Fetch users count from both "users" and "old_users"
      const usersRef = collection(firestore, "users");
      const oldUsersRef = collection(firestore, "old_users");
      const [usersSnapshot, oldUsersSnapshot] = await Promise.all([
        getCountFromServer(usersRef),
        getCountFromServer(oldUsersRef),
      ]);
      const totalUsers = usersSnapshot.data().count + oldUsersSnapshot.data().count;
      setUsersCount(totalUsers);

      const now = Date.now();

      // --- For Users ---
      const userKey = "userMetrics";
      const storedUserMetricsStr = localStorage.getItem(userKey);
      if (!storedUserMetricsStr) {
        // Initialize baseline if not present
        const newMetrics: StoredMetrics = { count: totalUsers, timestamp: now, lastView: null };
        localStorage.setItem(userKey, JSON.stringify(newMetrics));
        setUsersDiff(0);
      } else {
        try {
          const stored: StoredMetrics = JSON.parse(storedUserMetricsStr);
          if (stored.lastView === null) {
            // Diff is computed relative to stored.count
            const diff = totalUsers - stored.count;
            setUsersDiff(diff);
            if (diff !== 0) {
              // New users detected; set lastView to now (freeze baseline for 1 hour)
              stored.lastView = now;
              localStorage.setItem(userKey, JSON.stringify(stored));
            }
          } else {
            // lastView exists; check if window has expired
            if (now - stored.lastView < windowMs) {
              setUsersDiff(totalUsers - stored.count);
            } else {
              // Window expired: reset baseline
              const newMetrics: StoredMetrics = { count: totalUsers, timestamp: now, lastView: null };
              localStorage.setItem(userKey, JSON.stringify(newMetrics));
              setUsersDiff(0);
            }
          }
        } catch (err) {
          // In case of parsing error, reinitialize
          const newMetrics: StoredMetrics = { count: totalUsers, timestamp: now, lastView: null };
          localStorage.setItem(userKey, JSON.stringify(newMetrics));
          setUsersDiff(0);
        }
      }

      // --- For Contacts (similar logic) ---
      const contactKey = "contactMetrics";
      const storedContactMetricsStr = localStorage.getItem(contactKey);
      if (!storedContactMetricsStr) {
        const newMetrics: StoredMetrics = { count: contactsTotal, timestamp: now, lastView: null };
        localStorage.setItem(contactKey, JSON.stringify(newMetrics));
        setContactsDiff(0);
      } else {
        try {
          const stored: StoredMetrics = JSON.parse(storedContactMetricsStr);
          if (stored.lastView === null) {
            const diff = contactsTotal - stored.count;
            setContactsDiff(diff);
            if (diff !== 0) {
              stored.lastView = now;
              localStorage.setItem(contactKey, JSON.stringify(stored));
            }
          } else {
            if (now - stored.lastView < windowMs) {
              setContactsDiff(contactsTotal - stored.count);
            } else {
              const newMetrics: StoredMetrics = { count: contactsTotal, timestamp: now, lastView: null };
              localStorage.setItem(contactKey, JSON.stringify(newMetrics));
              setContactsDiff(0);
            }
          }
        } catch (err) {
          const newMetrics: StoredMetrics = { count: contactsTotal, timestamp: now, lastView: null };
          localStorage.setItem(contactKey, JSON.stringify(newMetrics));
          setContactsDiff(0);
        }
      }
    } catch (err: any) {
      console.error("Error fetching counts:", err);
      setError("Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Listen for localStorage changes across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "userMetrics" || e.key === "contactMetrics") {
        fetchCounts();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Helper to render the difference badge using your Badge component
  const renderDiff = (diff: number) => {
    if (diff > 0) {
      return (
        <Badge color="success">
          <ArrowUpIcon className="w-4 h-4" />
          {diff}
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge color="error">
          <ArrowDownIcon className="w-4 h-4" />
          {Math.abs(diff)}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Users Signed Up Card */}
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
              {loading ? "Loading..." : error ? "Error..." : usersCount}
            </h4>
          </div>
          {!(loading || error) && renderDiff(usersDiff)}
        </div>
      </div>

      {/* Contacts Received Card */}
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
              {loading ? "Loading..." : error ? "Error..." : contactsCount}
            </h4>
          </div>
          {!(loading || error) && renderDiff(contactsDiff)}
        </div>
      </div>
    </div>
  );
};

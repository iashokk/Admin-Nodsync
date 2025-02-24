"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// Define the interface for a log entry from Firestore
interface LogEntry {
  id: string;
  level: string;
  message: string;
  metadata: Record<string, any>;
  timestamp: any; // Firestore Timestamp
}

export default function LogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);

  const logLoadLimit = 20;
  // Function to load logs
  const loadLogs = async (loadMore = false) => {
    setLoading(true);
    try {
      const logsCollection = collection(firestore, "logs");
      let q;
      if (loadMore && lastDoc) {
        q = query(
          logsCollection,
          orderBy("timestamp", "desc"),
          startAfter(lastDoc),
          limit(logLoadLimit)
        );
      } else {
        q = query(logsCollection, orderBy("timestamp", "desc"), limit(logLoadLimit));
      }
      const snapshot = await getDocs(q);
      const newLogs: LogEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          level: data.level,
          message: data.message,
          metadata: data.metadata || {},
          timestamp: data.timestamp, // assume this is a Firestore Timestamp
        };
      });
      if (loadMore) {
        setLogs((prev) => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }
      if (!snapshot.empty) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      // If fewer than 50 logs were fetched, no more logs exist
      if (snapshot.docs.length < 50) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial logs on mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Toggle expanded state for a row if metadata exists
  const toggleRow = (id: string, metadata: Record<string, any>) => {
    if (Object.keys(metadata).length === 0) return;
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Determine badge color based on log level
  const getBadgeColor = (level: string) => {
    const lvl = level.toLowerCase();
    if (lvl === "error") return "error";
    if (lvl === "warning") return "warning";
    // Default to "success" (or customize as needed)
    return "success";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        {/* Changed min-w from [1002px] to full width */}
        <div className="min-w-full">
          {/* Added table-fixed and border-collapse classes */}
          <Table className="table-fixed border-collapse">
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Time
                </TableCell>
                <TableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Message
                </TableCell>
                <TableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Level
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow
                    onClick={() => toggleRow(log.id, log.metadata)}
                    className={Object.keys(log.metadata).length ? "cursor-pointer" : ""}
                  >
                    <TableCell className="px-3 py-4 sm:px-4 text-start">
                      <div className="flex items-center text-theme-sm dark:text-gray-400">
                        {log.timestamp?.toDate
                          ? log.timestamp.toDate().toLocaleString()
                          : log.timestamp}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {log.message}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge size="sm" color={getBadgeColor(log.level)}>
                        {log.level}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(log.id) && (
                    <TableRow>
                      <TableCell colSpan={3} className="px-3 py-4 bg-gray-50 dark:bg-gray-800">
                        <pre className="text-sm text-gray-600 dark:text-gray-300">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 text-center">
            {loading ? (
              <p>Loading...</p>
            ) : (
              hasMore && (
                <button
                  onClick={() => loadLogs(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Load More
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

// Define the interface for a User document from Firestore
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: any; // Firestore Timestamp
}

export default function UsersSignedup() {
  // State for main table (latest 5 users)
  const [users, setUsers] = useState<User[]>([]);
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalLastDoc, setModalLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalHasMore, setModalHasMore] = useState(true);

  // Fetch the latest 5 users for the main table
  const loadLatestUsers = async () => {
    try {
      const usersCollection = collection(firestore, "users");
      const q = query(usersCollection, orderBy("createdAt", "desc"), limit(5));
      const snapshot = await getDocs(q);
      const fetchedUsers: User[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          createdAt: data.createdAt,
        };
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error loading latest users:", error);
    }
  };

  // Fetch users for the modal with pagination (limit 50)
  const loadModalUsers = async (loadMore = false) => {
    setModalLoading(true);
    try {
      const usersCollection = collection(firestore, "users");
      let q;
      if (loadMore && modalLastDoc) {
        q = query(usersCollection, orderBy("createdAt", "desc"), startAfter(modalLastDoc), limit(50));
      } else {
        q = query(usersCollection, orderBy("createdAt", "desc"), limit(50));
      }
      const snapshot = await getDocs(q);
      const fetchedUsers: User[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          createdAt: data.createdAt,
        };
      });
      if (loadMore) {
        setModalUsers((prev) => [...prev, ...fetchedUsers]);
      } else {
        setModalUsers(fetchedUsers);
      }
      if (!snapshot.empty) {
        setModalLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      if (snapshot.docs.length < 50) {
        setModalHasMore(false);
      }
    } catch (error) {
      console.error("Error loading modal users:", error);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    loadLatestUsers();
  }, []);

  // Open modal and load the first batch of modal users
  const openModal = () => {
    setModalOpen(true);
    // Reset modal state
    setModalUsers([]);
    setModalLastDoc(null);
    setModalHasMore(true);
    loadModalUsers();
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Signed Up Users
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            See all
          </button>
        </div>
      </div>
      {/* Main Table: Latest 5 Users */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                User Mail
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Created Date
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {user.name}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {user.createdAt?.toDate
                    ? user.createdAt.toDate().toLocaleString()
                    : user.createdAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                All Users
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="mt-4 max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      User Mail
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Created Date
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {modalUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {user.name}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {user.createdAt?.toDate
                          ? user.createdAt.toDate().toLocaleString()
                          : user.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 text-center">
                {modalLoading ? (
                  <p>Loading...</p>
                ) : (
                  modalHasMore && (
                    <button
                      onClick={() => loadModalUsers(true)}
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
      )}
    </div>
  );
}

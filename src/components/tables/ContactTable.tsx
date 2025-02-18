"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

// Define interfaces for contacts and status
interface Contact {
  id: string;
  createdAt: Timestamp;
  description: string;
  email: string;
  name: string;
  number: string; // Changed property from phone to number
  role: string;
  subject: string;
  surname: string;
  topic: string;
}

interface StatusData {
  isDone: boolean;
  status: string;
  mentor: string;
}

type ContactWithStatus = Contact & StatusData;

const DEFAULT_STATUS: StatusData = {
  isDone: false,
  status: "Not Started",
  mentor: "Not Assigned",
};

// Options for dropdowns
const statusOptions = [
  "Not Started",
  "Awaiting Response",
  "In Progress",
  "Confirmed",
  "Done",
  "Cancelled",
];
const mentorOptions = ["Not Assigned", "Ashok", "Logesh", "Fazil", "Ranjani"];

// Popup data interface for modal
interface PopupData {
  type: "subject" | "name";
  subject?: string;
  description?: string;
  name?: string;
  email?: string;
  number?: string;
}

export default function ContactTable() {
  const [contacts, setContacts] = useState<ContactWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Fetch contacts and merge with status from Firestore
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const contactsCollection = collection(firestore, "contacts");
      const q = query(contactsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedContacts: ContactWithStatus[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const contactData = docSnap.data() as Contact;
          const id = docSnap.id;
          const statusRef = doc(firestore, "status", id);
          const statusSnap = await getDoc(statusRef);
          let statusData: StatusData;
          if (!statusSnap.exists()) {
            statusData = DEFAULT_STATUS;
            await setDoc(statusRef, statusData);
          } else {
            statusData = statusSnap.data() as StatusData;
          }
          return { id, ...contactData, ...statusData };
        })
      );
      setContacts(fetchedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Row selection handler
  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  // Dropdown update handlers
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(firestore, "status", id), { status: newStatus });
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleMentorChange = async (id: string, newMentor: string) => {
    try {
      await updateDoc(doc(firestore, "status", id), { mentor: newMentor });
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, mentor: newMentor } : c))
      );
    } catch (error) {
      console.error("Error updating mentor:", error);
    }
  };

  // Handlers for marking done/undo and deletion (unchanged)
  const handleMarkDone = async () => {
    try {
      const updates = selectedIds.map(async (id) => {
        await updateDoc(doc(firestore, "status", id), { isDone: true, status: "Done" });
      });
      await Promise.all(updates);
      setContacts((prev) =>
        prev.map((c) =>
          selectedIds.includes(c.id) ? { ...c, isDone: true, status: "Done" } : c
        )
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Error marking done:", error);
    }
  };

  const handleUndo = async () => {
    try {
      const updates = selectedIds.map(async (id) => {
        await updateDoc(doc(firestore, "status", id), { isDone: false, status: "Not Started" });
      });
      await Promise.all(updates);
      setContacts((prev) =>
        prev.map((c) =>
          selectedIds.includes(c.id) ? { ...c, isDone: false, status: "Not Started" } : c
        )
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Error undoing:", error);
    }
  };

  const handleDelete = async () => {
    setContacts((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  // Render subject as clickable (opens modal with subject and description)
  function renderSubjectDesktop(contact: ContactWithStatus) {
    const threshold = 15;
    const isLong = contact.subject.length > threshold;
    const displayText = isLong ? contact.subject.slice(0, threshold) + "..." : contact.subject;
    return (
      <span
        onClick={() =>
          setPopupData({ type: "subject", subject: contact.subject, description: contact.description })
        }
        className="cursor-pointer text-blue-600 hover:underline"
        title="Click to view details"
      >
        {displayText}
      </span>
    );
  }

  // Render name as clickable (opens modal with name, email and number)
  function renderNameDesktop(contact: ContactWithStatus) {
    return (
      <span
        onClick={() =>
          setPopupData({
            type: "name",
            name: contact.name + " " + (contact.surname || ""),
            email: contact.email,
            number: contact.number,
          })
        }
        className="cursor-pointer text-blue-600 hover:underline"
        title="Click to view details"
      >
        {contact.name} {contact.surname}
      </span>
    );
  }

  // Filter contacts based on status
  const filteredContacts = contacts.filter(
    (contact) => filterStatus === "All" || contact.status === filterStatus
  );

  // Common dropdown styling
  const dropdownClasses =
    "bg-white border border-gray-300 text-gray-700 py-1 px-2 pr-8 rounded leading-tight appearance-none focus:outline-none focus:ring focus:border-blue-500";

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Filter */}
      <div className="mb-4 flex items-center space-x-2">
        <label className="font-medium text-sm">Filter by status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring focus:border-blue-500"
        >
          <option value="All">All</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mb-4 text-center text-gray-700 dark:text-gray-300">Loading…</div>
      )}

      {/* Action Buttons */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex space-x-2">
          {selectedIds.some((id) => !contacts.find((c) => c.id === id)?.isDone) && (
            <button
              onClick={handleMarkDone}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200"
            >
              Done
            </button>
          )}
          {selectedIds.some((id) => contacts.find((c) => c.id === id)?.isDone) && (
            <button
              onClick={handleUndo}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-200"
            >
              Undo
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
          >
            Delete
          </button>
        </div>
      )}

      {/* Desktop/Table Version */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar rounded-xl border border-gray-200 bg-white shadow">
        <Table className="w-full table-auto">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filteredContacts.map((c) => c.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Subject
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Mentor
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created Date
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <TableRow
                key={contact.id}
                className={`transition-colors duration-200 hover:bg-gray-50 ${
                  contact.isDone ? "line-through text-gray-400" : ""
                }`}
              >
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={(e) => handleSelect(contact.id, e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  {renderNameDesktop(contact)}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  {renderSubjectDesktop(contact)}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <select
                    value={contact.status}
                    onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                    className={dropdownClasses}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <select
                    value={contact.mentor}
                    onChange={(e) => handleMentorChange(contact.id, e.target.value)}
                    className={dropdownClasses}
                  >
                    {mentorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  {contact.createdAt?.toDate
                    ? contact.createdAt.toDate().toLocaleString()
                    : contact.createdAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Card Version */}
      <div className="sm:hidden space-y-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-4 border rounded shadow bg-white transition-colors duration-200 ${
              contact.isDone ? "line-through text-gray-400" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">
                {contact.name} {contact.surname}
              </span>
              <input
                type="checkbox"
                checked={selectedIds.includes(contact.id)}
                onChange={(e) => handleSelect(contact.id, e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="mt-2 text-sm">
              <p>
                <span
                  onClick={() =>
                    setPopupData({
                      type: "name",
                      name: contact.name + " " + (contact.surname || ""),
                      email: contact.email,
                      number: contact.number,
                    })
                  }
                  className="cursor-pointer text-blue-600 hover:underline"
                >
                  {contact.name} {contact.surname}
                </span>
              </p>
              <p>
                <span
                  onClick={() =>
                    setPopupData({
                      type: "subject",
                      subject: contact.subject,
                      description: contact.description,
                    })
                  }
                  className="cursor-pointer text-blue-600 hover:underline"
                >
                  {contact.subject.length > 50
                    ? contact.subject.slice(0, 50) + "..."
                    : contact.subject}
                </span>
              </p>
              <p>
                <span className="font-medium">Topic:</span> {contact.topic}
              </p>
              <p>
                <span className="font-medium">Created:</span>{" "}
                {contact.createdAt?.toDate
                  ? contact.createdAt.toDate().toLocaleString()
                  : contact.createdAt}
              </p>
              <div className="mt-2">
                <label className="font-medium text-sm">Status: </label>
                <select
                  value={contact.status}
                  onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                  className={`${dropdownClasses} ml-2`}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2">
                <label className="font-medium text-sm">Mentor: </label>
                <select
                  value={contact.mentor}
                  onChange={(e) => handleMentorChange(contact.id, e.target.value)}
                  className={`${dropdownClasses} ml-2`}
                >
                  {mentorOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Popup Modal */}
      {popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setPopupData(null)}
          />
          {/* Modal Card */}
          <div className="relative bg-white p-6 rounded shadow max-w-md w-full mx-2">
            {popupData.type === "subject" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Subject Details</h2>
                <p className="mb-2">
                  <span className="font-medium">Subject: </span>
                  {popupData.subject}
                </p>
                <p className="mb-4">
                  <span className="font-medium">Description: </span>
                  {popupData.description}
                </p>
              </>
            )}
            {popupData.type === "name" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Contact Details</h2>
                <p className="mb-2">
                  <span className="font-medium">Name: </span>
                  {popupData.name}
                </p>
                {popupData.email && (
                  <p className="mb-2">
                    <span className="font-medium">Email: </span>
                    {popupData.email}
                  </p>
                )}
                {popupData.number && (
                  <p className="mb-4">
                    <span className="font-medium">Number: </span>
                    {popupData.number}
                  </p>
                )}
              </>
            )}
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => setPopupData(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #bbb;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #999;
        }
      `}</style>
    </div>
  );
}

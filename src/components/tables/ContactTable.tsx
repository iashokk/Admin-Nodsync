"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  startAfter,
} from "firebase/firestore";
import { firestore, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

// Define the interface for a Contact document from Firestore
interface Contact {
  id: string;
  createdAt: Timestamp;
  description: string;
  email: string;
  name: string;
  number: string; // using "number" as key from Firestore
  role: string;
  subject: string;
  surname: string;
  topic: string;
}

// Define the interface for Status data
interface StatusData {
  isDone: boolean;
  status: string;
  mentor: string;
}

type ContactWithStatus = Contact & StatusData;

// Extend ContactWithStatus for deleted contacts to include deletedBy field
interface DeletedContact extends ContactWithStatus {
  deletedBy: string;
}

const DEFAULT_STATUS: StatusData = {
  isDone: false,
  status: "Not Started",
  mentor: "Not Assigned",
};

// Options for dropdowns
const statusOptions = [
  "Not Started",
  "Awaiting Response",
  "Unresponsive",
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

// Helper function to return name color class based on status
function getNameColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "not started") return "text-blue-600 dark:text-blue-400";
  if (s === "awaiting response") return "text-orange-500 dark:text-orange-400";
  if (s === "unresponsive") return "text-red-500 dark:text-red-400";
  if (s === "cancelled") return "text-gray-500 dark:text-gray-400";
  if (s === "confirmed") return "text-yellow-500 dark:text-yellow-400";
  if (s === "in progress") return "text-green-500 dark:text-green-400";
  if (s === "done") return "text-purple-500 dark:text-purple-400";
  return "text-blue-600 dark:text-blue-400"; // default
}

export default function ContactTable() {
  const [contacts, setContacts] = useState<ContactWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // State for pagination
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const batchSize = 50; // Limiting Firestore calls

  // State for deleted contacts modal
  const [showDeletedModal, setShowDeletedModal] = useState<boolean>(false);
  const [deletedContacts, setDeletedContacts] = useState<DeletedContact[]>([]);

  const [user] = useAuthState(auth);

  // Fetch active contacts
  const fetchContacts = async (loadMore = false) => {
    setLoading(true);
    try {
      const contactsCollection = collection(firestore, "contacts");
      let q;
      if (loadMore && lastDoc) {
        q = query(
          contactsCollection,
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(batchSize + 1) // fetch one extra
        );
      } else {
        q = query(contactsCollection, orderBy("createdAt", "desc"), limit(batchSize + 1));
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const moreAvailable = docs.length > batchSize;
      // Use only the first batchSize docs for display.
      const docsToUse = moreAvailable ? docs.slice(0, batchSize) : docs;

      const fetchedContacts: ContactWithStatus[] = await Promise.all(
        docsToUse.map(async (docSnap) => {
          const contactData = docSnap.data() as Contact;
          const { id: _ignored, ...contactRest } = contactData; // Remove duplicate id
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
          return { id, ...contactRest, ...statusData };
        })
      );

      if (loadMore) {
        setContacts((prev) => [...prev, ...fetchedContacts]);
      } else {
        setContacts(fetchedContacts);
      }
      if (docsToUse.length > 0) {
        setLastDoc(docsToUse[docsToUse.length - 1]);
      } else {
        setLastDoc(null);
      }
      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Fetch deleted contacts from "deletedContacts" collection
  const fetchDeletedContacts = async () => {
    try {
      const deletedRef = collection(firestore, "deletedContacts");
      const q = query(deletedRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const data: DeletedContact[] = docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as DeletedContact[];
      setDeletedContacts(data);
    } catch (error) {
      console.error("Error fetching deleted contacts:", error);
    }
  };

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

  // Delete: move the contact to "deletedContacts" with a deletedBy field, then delete from "contacts" and "status"
  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const contact = contacts.find((c) => c.id === id);
          if (contact) {
            const deletedBy = user?.email || "Unknown";
            // Save to "deletedContacts" with additional deletedBy field
            await setDoc(doc(firestore, "deletedContacts", id), { ...contact, deletedBy });
            // Delete from "contacts" and "status"
            await deleteDoc(doc(firestore, "contacts", id));
            await deleteDoc(doc(firestore, "status", id));
          }
        })
      );
      // Remove deleted contacts from state
      setContacts((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Error deleting contacts:", error);
    }
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

  // Render name as clickable (opens modal with name, email and number) using dynamic color based on status
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
        className={`cursor-pointer hover:underline ${getNameColor(contact.status)}`}
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

  // Common dropdown styling (updated for dark mode)
  const dropdownClasses =
    "bg-white border border-gray-300 text-gray-700 py-1 px-2 pr-8 rounded leading-tight appearance-none focus:outline-none focus:ring focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Filter + View Deleted */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="font-medium text-sm text-gray-800 dark:text-white/90">
            Filter by status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={async () => {
            await fetchDeletedContacts();
            setShowDeletedModal(true);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          View Deleted
        </button>
      </div>

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
      <div className="hidden sm:block overflow-x-auto custom-scrollbar rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <Table className="w-full table-auto">
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
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
              <TableCell className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Name
              </TableCell>
              <TableCell className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Subject
              </TableCell>
              <TableCell className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Status
              </TableCell>
              <TableCell className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Mentor
              </TableCell>
              <TableCell className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Created Date
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-700">
            {filteredContacts.map((contact) => (
              <TableRow
                key={contact.id}
                className={`transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  contact.status.toLowerCase() === "cancelled" ? "line-through text-gray-400" : ""
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
                <TableCell className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {contact.createdAt?.toDate
                    ? contact.createdAt.toDate().toLocaleString()
                    : String(contact.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading && (
          <div className="py-3 text-center text-gray-700 dark:text-gray-300">
            Loading…
          </div>
        )}
        {!loading && hasMore && (
          <div className="py-3 text-center">
            <button
              onClick={() => fetchContacts(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Mobile/Card Version */}
      <div className="sm:hidden space-y-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-4 border rounded shadow bg-white transition-colors duration-200 ${
              contact.status.toLowerCase() === "cancelled" ? "line-through text-gray-400" : ""
            } dark:bg-gray-800 dark:border-gray-700`}
          >
            {/* Top section with Name and Checkbox */}
            <div className="flex justify-between items-center">
              <span 
                onClick={() =>
                  setPopupData({
                    type: "name",
                    name: contact.name + " " + (contact.surname || ""),
                    email: contact.email,
                    number: contact.number,
                  })
                }
                className={`text-lg font-semibold ${getNameColor(contact.status)}`}
              >
                {contact.name} {contact.surname}
              </span>
              <input
                type="checkbox"
                checked={selectedIds.includes(contact.id)}
                onChange={(e) => handleSelect(contact.id, e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            {/* Details section without duplicate name */}
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
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
                  : String(contact.createdAt)}
              </p>
              <div className="mt-2">
                <label className="font-medium text-sm text-gray-800 dark:text-white">
                  Status:
                </label>
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
                <label className="font-medium text-sm text-gray-800 dark:text-white">
                  Mentor:
                </label>
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

      {/* Popup Modal for contact details */}
      {popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setPopupData(null)}
          />
          {/* Modal Card */}
          <div className="relative bg-white p-6 rounded shadow max-w-md w-full mx-2 dark:bg-gray-900">
            {popupData.type === "subject" && (
              <>
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  Subject Details
                </h2>
                <p className="mb-2 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Subject: </span>
                  {popupData.subject}
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Description: </span>
                  {popupData.description}
                </p>
              </>
            )}
            {popupData.type === "name" && (
              <>
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  Contact Details
                </h2>
                <p className="mb-2 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Name: </span>
                  {popupData.name}
                </p>
                {popupData.email && (
                  <p className="mb-2 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Email: </span>
                    {popupData.email}
                  </p>
                )}
                {popupData.number && (
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Number: </span>
                    {popupData.number}
                  </p>
                )}
              </>
            )}
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => setPopupData(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Popup Modal for deleted contacts */}
      {showDeletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Deleted Contacts
              </h3>
              <button
                onClick={() => setShowDeletedModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="mt-4 max-h-[400px] overflow-y-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Name
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Subject
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Deleted At
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Deleted By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deletedContacts.map((contact) => (
                    <tr key={contact.id} className="text-red-500">
                      <td className="py-2 px-4">{contact.name} {contact.surname}</td>
                      <td className="py-2 px-4">{contact.subject}</td>
                      <td className="py-2 px-4">
                        {contact.createdAt?.toDate
                          ? contact.createdAt.toDate().toLocaleString()
                          : String(contact.createdAt)}
                      </td>
                      <td className="py-2 px-4">{contact.deletedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Optionally, add a "Load More" if needed */}
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

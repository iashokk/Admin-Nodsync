"use client";
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  topic: string;
  subject: string;
  status: string;
  mentor: string;
  isDone?: boolean;
}

const initialContacts: Contact[] = [
  {
    id: 1,
    name: "SHALINI S",
    email: "btechcse231533@smvec.ac.in",
    phone: "9952473504",
    topic: "general",
    subject: "9952473504 I want to start from scrach",
    status: "In Progress",
    mentor: "Ashok",
    isDone: false,
  },
  {
    id: 2,
    name: "DEVAGURU V",
    email: "devaguruvkdk@gmail.com",
    phone: "8610332446",
    topic: "general",
    subject: "cybersecurity",
    status: "In Progress",
    mentor: "Logesh",
    isDone: false,
  },
  {
    id: 3,
    name: "Kiran",
    email: "",
    phone: "9362427258",
    topic: "",
    subject:
      "I wanna start working on IoT related stuffs but I don't know what to study and when I asked my senior about it he said me to do projects and that I'll eventually learn from it but I need help with starting out with that too",
    status: "Awaiting Response",
    mentor: "Fazil",
    isDone: false,
  },
];

const statusOptions = [
  "Not Started",
  "Awaiting Response",
  "In Progress",
  "Confirmed",
  "Done",
  "Cancelled",
];
const mentorOptions = ["Ashok", "Logesh", "Fazil", "Ranjani"];

export default function ContactTable() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [popupSubject, setPopupSubject] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  /* ---------------------------
   *    Mobile: Toggle Subject
   * --------------------------- */
  const handleToggleSubject = (id: number) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ---------------------------
   *  Common Row Selection Logic
   * --------------------------- */
  const handleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  /* ---------------------------
   *   Dropdown Handlers
   * --------------------------- */
  const handleStatusChange = (id: number, newStatus: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, status: newStatus } : contact
      )
    );
  };

  const handleMentorChange = (id: number, newMentor: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, mentor: newMentor } : contact
      )
    );
  };

  /* ---------------------------
   *   Done / Undo / Delete
   * --------------------------- */
  const handleMarkDone = () => {
    setContacts((prev) => {
      const updated = prev.map((contact) =>
        selectedIds.includes(contact.id)
          ? { ...contact, isDone: true, status: "Done" }
          : contact
      );
      // Move done rows to the bottom.
      updated.sort((a, b) => {
        if (a.isDone && !b.isDone) return 1;
        if (!a.isDone && b.isDone) return -1;
        return 0;
      });
      return updated;
    });
    setSelectedIds([]);
  };

  const handleUndo = () => {
    setContacts((prev) => {
      const updated = prev.map((contact) =>
        selectedIds.includes(contact.id) && contact.isDone
          ? { ...contact, isDone: false, status: "Not Started" }
          : contact
      );
      // Move undone rows back to the top.
      updated.sort((a, b) => {
        if (a.isDone && !b.isDone) return 1;
        if (!a.isDone && b.isDone) return -1;
        return 0;
      });
      return updated;
    });
    setSelectedIds([]);
  };

  const handleDelete = () => {
    setContacts((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  // Are the selected rows done or not?
  const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id));
  const hasDoneSelected = selectedContacts.some((c) => c.isDone);
  const hasNotDoneSelected = selectedContacts.some((c) => !c.isDone);

  /* ---------------------------
   *   Desktop: Truncated + Modal
   * --------------------------- */
  function renderSubjectDesktop(contact: Contact) {
    const threshold = 15;
    const isLong = contact.subject.length > threshold;
    const displayText = isLong
      ? contact.subject.slice(0, threshold) + "..."
      : contact.subject;

    return isLong ? (
      <span
        onClick={() => setPopupSubject(contact.subject)}
        className="cursor-pointer text-blue-600 hover:underline"
        title="Click to view full text"
      >
        {displayText}
      </span>
    ) : (
      <span>{contact.subject}</span>
    );
  }

  /* ---------------------------
   *   Mobile: Inline Toggle
   * --------------------------- */
  function renderSubjectMobile(contact: Contact) {
    const threshold = 50;
    const isLong = contact.subject.length > threshold;
    const expanded = expandedSubjects[contact.id];
    const displayText =
      isLong && !expanded ? contact.subject.slice(0, threshold) + "..." : contact.subject;

    return isLong ? (
      <span
        onClick={() => handleToggleSubject(contact.id)}
        className="cursor-pointer text-blue-600 hover:underline"
        title={contact.subject}
      >
        {displayText}
      </span>
    ) : (
      <span>{contact.subject}</span>
    );
  }

  // Filter contacts based on the selected filterStatus.
  const filteredContacts = contacts.filter(
    (contact) => filterStatus === "All" || contact.status === filterStatus
  );

  // Common dropdown classes.
  const dropdownClasses =
    "bg-white border border-gray-300 text-gray-700 py-1 px-2 pr-8 rounded leading-tight appearance-none focus:outline-none focus:ring focus:border-blue-500";

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Status Filter */}
      <div className="mb-4 flex items-center space-x-2">
        <label className="font-medium text-sm">Filter by status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded leading-tight focus:outline-none focus:ring focus:border-blue-500"
        >
          <option value="All">All</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex space-x-2">
          {hasNotDoneSelected && (
            <button
              onClick={handleMarkDone}
              className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 transition duration-200"
            >
              Done
            </button>
          )}
          {hasDoneSelected && (
            <button
              onClick={handleUndo}
              className="px-4 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 transition duration-200"
            >
              Undo
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 transition duration-200"
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
                      setSelectedIds(contacts.map((c) => c.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  checked={selectedIds.length === contacts.length && contacts.length > 0}
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
                Topic
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Number
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
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
                <TableCell className="px-4 py-3 whitespace-nowrap">{contact.name}</TableCell>
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
                <TableCell className="px-4 py-3 whitespace-nowrap">{contact.topic}</TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">{contact.phone}</TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">{contact.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Card Version (unchanged) */}
      <div className="sm:hidden space-y-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-4 border rounded shadow bg-white transition-colors duration-200 ${
              contact.isDone ? "line-through text-gray-400" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{contact.name}</span>
              <input
                type="checkbox"
                checked={selectedIds.includes(contact.id)}
                onChange={(e) => handleSelect(contact.id, e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="mt-2 text-sm">
              <p>
                <span className="font-medium">Email:</span> {contact.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {contact.phone}
              </p>
              <p>
                <span className="font-medium">Topic:</span> {contact.topic}
              </p>
              <p>
                <span className="font-medium">Subject:</span>{" "}
                {renderSubjectMobile(contact)}
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

      {/* Desktop Subject Popup Modal */}
      {popupSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setPopupSubject(null)}
          />
          {/* Modal Card */}
          <div className="relative bg-white p-6 rounded shadow max-w-md w-full mx-2">
            <h2 className="text-lg font-semibold mb-4">Full Subject</h2>
            <p className="mb-4">{popupSubject}</p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => setPopupSubject(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px; /* Adjust thickness */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; /* Track color */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #bbb; /* Thumb color */
          border-radius: 9999px; /* Rounded corners */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #999; /* Hover color */
        }
      `}</style>
    </div>
  );
}

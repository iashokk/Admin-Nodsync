"use client";
import React, { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";
import { firestore, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Entry {
  id: string;
  description: string;
  amount: number;
  createdAt: Timestamp;
  userEmail: string;
}

export default function ExpenseTracker() {
  const [user] = useAuthState(auth);

  // Input states for adding new entries
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  // Data states for incomes and expenses from Firestore
  const [incomes, setIncomes] = useState<Entry[]>([]);
  const [expenses, setExpenses] = useState<Entry[]>([]);

  // Modal states for viewing detailed lists
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Fetch incomes from Firestore
  const fetchIncomes = async () => {
    try {
      const incomesCollection = collection(firestore, "income");
      const q = query(incomesCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Entry[];
      setIncomes(data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    }
  };

  // Fetch expenses from Firestore
  const fetchExpenses = async () => {
    try {
      const expensesCollection = collection(firestore, "expense");
      const q = query(expensesCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Entry[];
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchExpenses();
  }, []);

  // Add new income document to Firestore
  const addIncome = async () => {
    if (!incomeDescription || !incomeAmount || !user) return;
    try {
      const newIncome = {
        description: incomeDescription,
        amount: parseFloat(incomeAmount),
        createdAt: Timestamp.now(),
        userEmail: user.email,
      };
      const docRef = await addDoc(collection(firestore, "income"), newIncome);
      setIncomes((prev) => [{ id: docRef.id, ...newIncome }, ...prev]);
      setIncomeDescription("");
      setIncomeAmount("");
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };

  // Add new expense document to Firestore
  const addExpense = async () => {
    if (!expenseDescription || !expenseAmount || !user) return;
    try {
      const newExpense = {
        description: expenseDescription,
        amount: parseFloat(expenseAmount),
        createdAt: Timestamp.now(),
        userEmail: user.email,
      };
      const docRef = await addDoc(collection(firestore, "expense"), newExpense);
      setExpenses((prev) => [{ id: docRef.id, ...newExpense }, ...prev]);
      setExpenseDescription("");
      setExpenseAmount("");
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  // Totals calculation with two-decimal precision
  const totalIncome = incomes.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
        Expense Tracker
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
            Income
          </h2>
          <div className="mb-4">
            <input
              type="text"
              value={incomeDescription}
              onChange={(e) => setIncomeDescription(e.target.value)}
              placeholder="Income description"
              className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="number"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={addIncome}
              className="w-full bg-green-500 hover:bg-green-600 transition text-white rounded p-2"
            >
              Add Income
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Income List
            </h3>
            {incomes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No income added yet.</p>
            ) : (
              <p
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => setShowIncomeModal(true)}
              >
                Click to view
              </p>
            )}
          </div>
          <div className="mt-2 font-bold text-gray-800 dark:text-white">
            Total Income: ₹ {totalIncome.toFixed(2)}
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
            Expense
          </h2>
          <div className="mb-4">
            <input
              type="text"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder="Expense description"
              className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={addExpense}
              className="w-full bg-red-500 hover:bg-red-600 transition text-white rounded p-2"
            >
              Add Expense
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Expense List
            </h3>
            {expenses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No expense added yet.</p>
            ) : (
              <p
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => setShowExpenseModal(true)}
              >
                Click to view
              </p>
            )}
          </div>
          <div className="mt-2 font-bold text-gray-800 dark:text-white">
            Total Expense: ₹ {totalExpense.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-xl p-4 text-center">
        <div className="text-xl font-bold text-gray-800 dark:text-white">
          Net Profit: ₹ {netProfit.toFixed(2)}
        </div>
      </div>

      {/* Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Income Details
              </h3>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="mt-4 max-h-[400px] overflow-y-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      User Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {incomes.map((income) => (
                    <tr key={income.id}>
                      <td className="py-2 px-4">{income.description}</td>
                      <td className="py-2 px-4">₹ {income.amount.toFixed(2)}</td>
                      <td className="py-2 px-4">
                        {income.createdAt.toDate().toLocaleString()}
                      </td>
                      <td className="py-2 px-4">{income.userEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Expense Details
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="mt-4 max-h-[400px] overflow-y-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      User Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="py-2 px-4">{expense.description}</td>
                      <td className="py-2 px-4">₹ {expense.amount.toFixed(2)}</td>
                      <td className="py-2 px-4">
                        {expense.createdAt.toDate().toLocaleString()}
                      </td>
                      <td className="py-2 px-4">{expense.userEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

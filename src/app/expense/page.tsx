"use client";

import React, { useState } from "react";

interface Entry {
  id: number;
  description: string;
  amount: number;
}

export default function ExpenseTracker() {
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const [incomes, setIncomes] = useState<Entry[]>([]);
  const [expenses, setExpenses] = useState<Entry[]>([]);

  const addIncome = () => {
    if (!incomeDescription || !incomeAmount) return;
    const newEntry: Entry = {
      id: Date.now(),
      description: incomeDescription,
      amount: parseFloat(incomeAmount),
    };
    setIncomes([...incomes, newEntry]);
    setIncomeDescription("");
    setIncomeAmount("");
  };

  const addExpense = () => {
    if (!expenseDescription || !expenseAmount) return;
    const newEntry: Entry = {
      id: Date.now(),
      description: expenseDescription,
      amount: parseFloat(expenseAmount),
    };
    setExpenses([...expenses, newEntry]);
    setExpenseDescription("");
    setExpenseAmount("");
  };

  const totalIncome = incomes.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Expense Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Card */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-2">Income</h2>
          <div className="mb-4">
            <input
              type="text"
              value={incomeDescription}
              onChange={(e) => setIncomeDescription(e.target.value)}
              placeholder="Income description"
              className="w-full border border-gray-300 rounded p-2 mb-2"
            />
            <input
              type="number"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-300 rounded p-2 mb-2"
            />
            <button
              onClick={addIncome}
              className="w-full bg-green-500 text-white rounded p-2 hover:bg-green-600 transition"
            >
              Add Income
            </button>
          </div>
          <div>
            <h3 className="font-semibold">Income List</h3>
            {incomes.length === 0 ? (
              <p className="text-gray-500">No income added yet.</p>
            ) : (
              <ul>
                {incomes.map((income) => (
                  <li
                    key={income.id}
                    className="flex justify-between border-b border-gray-200 py-1"
                  >
                    <span>{income.description}</span>
                    <span>₹ {income.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-2 font-bold">
            Total Income: ₹ {totalIncome.toFixed(2)}
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-2">Expense</h2>
          <div className="mb-4">
            <input
              type="text"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder="Expense description"
              className="w-full border border-gray-300 rounded p-2 mb-2"
            />
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-300 rounded p-2 mb-2"
            />
            <button
              onClick={addExpense}
              className="w-full bg-red-500 text-white rounded p-2 hover:bg-red-600 transition"
            >
              Add Expense
            </button>
          </div>
          <div>
            <h3 className="font-semibold">Expense List</h3>
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expense added yet.</p>
            ) : (
              <ul>
                {expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex justify-between border-b border-gray-200 py-1"
                  >
                    <span>{expense.description}</span>
                    <span>₹ {expense.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-2 font-bold">
            Total Expense: ₹ {totalExpense.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="mt-6 bg-white shadow rounded-xl p-4 text-center">
        <div className="text-xl font-bold">
          Net Profit: ₹ {netProfit.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

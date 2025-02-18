"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ExpenseTotals {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  updateTotals: (totalIncome: number, totalExpense: number, netProfit: number) => void;
}

const ExpenseTotalsContext = createContext<ExpenseTotals | undefined>(undefined);

export function ExpenseTotalsProvider({ children }: { children: ReactNode }) {
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  });

  // On mount, rehydrate state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("expenseTotals");
    console.log("Stored totals:", stored);
    if (stored) {
      setTotals(JSON.parse(stored));
    }
  }, []);

  // Whenever totals change, persist them
  useEffect(() => {
    localStorage.setItem("expenseTotals", JSON.stringify(totals));
  }, [totals]);

  const updateTotals = (totalIncome: number, totalExpense: number, netProfit: number) => {
    setTotals({ totalIncome, totalExpense, netProfit });
  };

  return (
    <ExpenseTotalsContext.Provider value={{ ...totals, updateTotals }}>
      {children}
    </ExpenseTotalsContext.Provider>
  );
}

export function useExpenseTotals() {
  const context = useContext(ExpenseTotalsContext);
  if (!context) {
    throw new Error("useExpenseTotals must be used within an ExpenseTotalsProvider");
  }
  return context;
}

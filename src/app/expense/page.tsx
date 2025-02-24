import ExpenseTrackerClient from "./client";

export const metadata = {
  title: "Expense Tracker",
  description: "Expense Tracker",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExpenseTracker(){
  return <ExpenseTrackerClient/>
}
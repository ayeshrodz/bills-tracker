// src/pages/BillsListPage.tsx
import { Link } from "react-router-dom";
import { useBills } from "../hooks/useBills";
import { BillsGrid } from "../components/BillsGrid";

export default function BillsListPage() {
  const { bills, deleteBill, loading, error } = useBills();

  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  const latestBill = bills.length
    ? [...bills].sort((a, b) =>
        a.payment_date.localeCompare(b.payment_date)
      )[bills.length - 1]
    : null;

  const formattedTotalAmount = totalAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="pt-20 px-4 pb-10 max-w-5xl mx-auto">
      {/* Header + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Bills overview
          </h2>
          <p className="text-sm text-slate-500">
            Track your recurring bills, payment dates, and notes.
          </p>
        </div>
        <div className="flex justify-start sm:justify-end">
          <Link
            to="/add"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            + Add Bill
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dashboard summary */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-800 text-white p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-300">
            Total bills
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalBills}</p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total amount
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ${formattedTotalAmount}
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Last payment
          </p>
          {latestBill ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-slate-900">
                {latestBill.bill_type}
              </p>
              <p className="text-xs text-slate-500">
                {latestBill.payment_date} • $
                {latestBill.amount.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No payments yet.</p>
          )}
        </div>
      </section>

      {/* Content */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading bills…</p>
      ) : (
        <BillsGrid bills={bills} onDelete={deleteBill} />
      )}
    </div>
  );
}

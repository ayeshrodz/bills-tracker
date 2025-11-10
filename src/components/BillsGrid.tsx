// src/components/BillsGrid.tsx
import { Link } from "react-router-dom";
import type { Bill } from "../hooks/useBills";

type Props = {
  bills: Bill[];
  onDelete: (id: string) => void;
};

const formatMonthYear = (bill: Bill) => {
  const monthName = new Date(0, bill.billing_month - 1).toLocaleString(
    "default",
    { month: "short" } // Jan, Feb, Mar…
  );
  return `${monthName} ${bill.billing_year}`;
};

export const BillsGrid = ({ bills, onDelete }: Props) => {
  if (!bills.length) {
    return (
      <p className="text-slate-500 text-center py-10">
        No bills yet. Click <span className="font-semibold">Add Bill</span> to
        create your first one.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bills.map((b) => (
        <article
          key={b.id}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-800">
                {b.bill_type}
              </h3>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {formatMonthYear(b)}
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              ${b.amount.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Paid on <span className="font-medium">{b.payment_date}</span>
            </p>

            {b.note && (
              <p className="mt-3 text-xs text-slate-600 italic line-clamp-1">
                {b.note}
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Link
              to={`/bills/${b.id}`}
              className="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => onDelete(b.id)}
              className="inline-flex items-center px-3 py-2 rounded-md bg-red-600 text-sm text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

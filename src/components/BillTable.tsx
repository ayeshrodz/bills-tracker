import { Link } from "react-router-dom";
import type { Bill } from "../hooks/useBills";

type Props = {
  bills: Bill[];
  onDelete: (id: string) => void;
};

export const BillTable = ({ bills, onDelete }: Props) => {
  if (bills.length === 0)
    return (
      <p className="text-slate-500 text-center">
        No bills yet. Add one above.
      </p>
    );

  const monthName = (num: number) =>
    new Date(0, num - 1).toLocaleString("default", { month: "long" });

  return (
    <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
      <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
        <tr>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Month/Year</th>
          <th className="px-4 py-3">Payment Date</th>
          <th className="px-4 py-3">Amount</th>
          <th className="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((b) => (
          <tr
            key={b.id}
            className="border-t border-slate-100 hover:bg-slate-50"
          >
            <td className="px-4 py-3">{b.bill_type}</td>
            <td className="px-4 py-3">
              {monthName(b.billing_month)} {b.billing_year}
            </td>
            <td className="px-4 py-3">{b.payment_date}</td>
            <td className="px-4 py-3">${b.amount.toFixed(2)}</td>
            <td className="px-4 py-3 text-right">
              <Link
                to={`/edit/${b.id}`}
                className="px-3 py-2 mr-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 inline-flex items-center"
              >
                Edit
              </Link>
              <button
                onClick={() => onDelete(b.id)}
                className="px-3 py-2 rounded-md bg-red-600 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

import type { Bill } from "../hooks/useBills";

type Props = {
  bills: Bill[];
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
};

export const BillTable = ({ bills, onEdit, onDelete }: Props) => {
  if (bills.length === 0)
    return <p className="text-slate-500">No bills yet. Add one above.</p>;

  return (
    <table className="min-w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
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
              {b.billing_month}/{b.billing_year}
            </td>
            <td className="px-4 py-3">{b.payment_date}</td>
            <td className="px-4 py-3">${b.amount.toFixed(2)}</td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={() => onEdit(b)}
                className="px-3 py-1.5 mr-2 rounded-md border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(b.id)}
                className="px-3 py-1.5 rounded-md bg-red-500 text-xs text-white hover:bg-red-600"
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
